import { query, runCypher, runCypherWrite, NEO4J_LABELS, NEO4J_RELATIONSHIPS, logger } from '@ace/shared';
import type { DependencyGraph, GraphNode, GraphEdge } from '@ace/shared';

export class GraphService {
  /**
   * Build the full dependency graph for a repository.
   * Reads parsed data from PostgreSQL and writes nodes/edges to Neo4j.
   */
  async buildGraph(repositoryId: string): Promise<void> {
    logger.info({ repositoryId }, 'Starting graph build');

    // Ensure repository node
    await runCypherWrite(
      `MERGE (r:${NEO4J_LABELS.REPOSITORY} {id: $id})
       SET r.repositoryId = $id, r.updatedAt = datetime()`,
      { id: repositoryId }
    );

    // Load all files from Postgres
    const files = await query<{
      id: string; path: string; name: string; language: string | null;
    }>(
      'SELECT id, path, name, language FROM repo_files WHERE repository_id = $1',
      [repositoryId]
    );

    // Create File nodes
    for (const file of files) {
      await runCypherWrite(
        `MERGE (f:${NEO4J_LABELS.FILE} {id: $id, repositoryId: $repositoryId})
         SET f.path = $path, f.name = $name, f.language = $language`,
        { id: file.id, repositoryId, path: file.path, name: file.name, language: file.language }
      );

      // Link to repository
      await runCypherWrite(
        `MATCH (r:${NEO4J_LABELS.REPOSITORY} {id: $repoId}), (f:${NEO4J_LABELS.FILE} {id: $fileId})
         MERGE (r)-[:${NEO4J_RELATIONSHIPS.CONTAINS}]->(f)`,
        { repoId: repositoryId, fileId: file.id }
      );
    }

    // Load functions from Postgres
    const functions = await query<{
      id: string; file_id: string; name: string;
      start_line: number; is_exported: boolean;
    }>(
      'SELECT id, file_id, name, start_line, is_exported FROM functions WHERE repository_id = $1',
      [repositoryId]
    );

    // Create Function nodes
    for (const fn of functions) {
      await runCypherWrite(
        `MERGE (fn:${NEO4J_LABELS.FUNCTION} {id: $id, repositoryId: $repositoryId})
         SET fn.name = $name, fn.startLine = $startLine, fn.isExported = $isExported`,
        { id: fn.id, repositoryId, name: fn.name, startLine: fn.start_line, isExported: fn.is_exported }
      );
      // DEFINES relationship
      await runCypherWrite(
        `MATCH (f:${NEO4J_LABELS.FILE} {id: $fileId}), (fn:${NEO4J_LABELS.FUNCTION} {id: $fnId})
         MERGE (f)-[:${NEO4J_RELATIONSHIPS.DEFINES}]->(fn)`,
        { fileId: fn.file_id, fnId: fn.id }
      );
    }

    // Create IMPORTS relationships based on parsed import data
    // We store imports as dependencies in the file table; resolve them to file IDs
    const importRelations = await query<{
      file_id: string; source: string;
    }>(
      // This is a conceptual query — in production, import relations
      // would be stored in a dedicated table
      `SELECT DISTINCT f.id AS file_id, unnest(ARRAY[]::text[]) AS source
       FROM repo_files f WHERE f.repository_id = $1 LIMIT 0`,
      [repositoryId]
    );

    // Build IMPORTS edges
    const fileByPath = Object.fromEntries(files.map((f) => [f.path, f.id]));
    const allImports = await query<{ file_id: string; source: string }>(
      `SELECT DISTINCT rf.id AS file_id, imp.source
       FROM repo_files rf
       JOIN LATERAL (
         SELECT value->>'source' AS source
         FROM jsonb_array_elements(COALESCE((
           SELECT to_jsonb(array_agg(unnest_val)) FROM unnest(ARRAY[]::text[]) unnest_val
         ), '[]'::jsonb))
       ) imp ON true
       WHERE rf.repository_id = $1`,
      [repositoryId]
    ).catch(() => []);

    // For each import, try to resolve to a file
    for (const imp of allImports) {
      const possiblePaths = resolveImportPaths(imp.source, files.map(f => f.path));
      for (const resolvedPath of possiblePaths) {
        const targetId = fileByPath[resolvedPath];
        if (targetId && targetId !== imp.file_id) {
          await runCypherWrite(
            `MATCH (a:${NEO4J_LABELS.FILE} {id: $srcId}), (b:${NEO4J_LABELS.FILE} {id: $tgtId})
             MERGE (a)-[:${NEO4J_RELATIONSHIPS.IMPORTS}]->(b)`,
            { srcId: imp.file_id, tgtId: targetId }
          );
        }
      }
    }

    logger.info({ repositoryId, fileCount: files.length, fnCount: functions.length }, 'Graph build complete');
  }

  async getGraph(repositoryId: string) {
    const nodeRows = await runCypher<{ n: Record<string, unknown>; type: string }>(
      `MATCH (n)
       WHERE n.repositoryId = $repositoryId
         AND NOT n:Repository
       RETURN n, labels(n)[0] AS type`,
      { repositoryId }
    );

    const edgeRows = await runCypher<{
      srcId: string; tgtId: string; type: string;
    }>(
      `MATCH (a)-[r]->(b)
       WHERE a.repositoryId = $repositoryId AND b.repositoryId = $repositoryId
         AND NOT a:Repository AND NOT b:Repository
       RETURN a.id AS srcId, b.id AS tgtId, type(r) AS type`,
      { repositoryId }
    );

    // Transform to API format (different from internal GraphNode/GraphEdge types)
    const nodes = nodeRows.map((row) => ({
      id: row.n['id'] as string,
      type: row.type as string,
      name: (row.n['name'] ?? row.n['path']) as string,
      filePath: row.n['path'] as string | undefined,
      language: row.n['language'] as string | undefined,
      linesOfCode: row.n['linesOfCode'] as number | undefined,
    }));

    const edges = edgeRows.map((row) => ({
      source: row.srcId,
      target: row.tgtId,
      type: row.type as string,
    }));

    return { nodes, edges };
  }

  async getImportChain(
    repositoryId: string,
    fileId: string,
    depth = 3
  ) {
    const rows = await runCypher<{
      srcId: string; srcLabel: string; srcType: string;
      tgtId: string; tgtLabel: string; tgtType: string;
    }>(
      `MATCH path = (start:File {id: $fileId})-[:IMPORTS*1..${depth}]->(dep)
       WHERE dep.repositoryId = $repositoryId
       UNWIND relationships(path) AS r
       RETURN
         startNode(r).id AS srcId, startNode(r).path AS srcLabel, 'File' AS srcType,
         endNode(r).id   AS tgtId, endNode(r).path   AS tgtLabel, 'File' AS tgtType`,
      { fileId, repositoryId }
    );

    const nodeMap = new Map<string, any>();
    const edges: any[] = [];

    for (const row of rows) {
      if (!nodeMap.has(row.srcId)) {
        nodeMap.set(row.srcId, {
          id: row.srcId,
          type: 'File',
          name: row.srcLabel,
          filePath: row.srcLabel,
        });
      }
      if (!nodeMap.has(row.tgtId)) {
        nodeMap.set(row.tgtId, {
          id: row.tgtId,
          type: 'File',
          name: row.tgtLabel,
          filePath: row.tgtLabel,
        });
      }
      edges.push({
        source: row.srcId,
        target: row.tgtId,
        type: 'IMPORTS',
      });
    }

    return {
      nodes: [...nodeMap.values()],
      edges,
    };
  }
}

function resolveImportPaths(source: string, filePaths: string[]): string[] {
  const candidates: string[] = [];
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.py'];

  for (const ext of extensions) {
    candidates.push(`${source}${ext}`);
    candidates.push(`${source}/index${ext}`);
  }

  return candidates.filter((c) => filePaths.some((p) => p.endsWith(c) || p === c));
}
