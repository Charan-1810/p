import { FileAnalysis, ParsedFunction, ParsedClass, ParsedImport } from '@ace/shared';

/**
 * Python parser using regex-based AST simulation.
 * For production, this should be replaced with a Python subprocess calling `ast` module
 * or using tree-sitter-python bindings.
 */
export class PythonParser {
  async parse(_filePath: string, content: string): Promise<Partial<FileAnalysis>> {
    const lines = content.split('\n');
    const functions: ParsedFunction[] = [];
    const classes: ParsedClass[] = [];
    const imports: ParsedImport[] = [];

    let currentClass: ParsedClass | null = null;
    let currentClassIndent = -1;
    let currentFunction: { fn: ParsedFunction; indent: number } | null = null;

    const fnRegex = /^(\s*)(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)/;
    const classRegex = /^(\s*)class\s+(\w+)(?:\s*\(([^)]*)\))?:/;
    const importRegex = /^\s*import\s+(.+)/;
    const fromImportRegex = /^\s*from\s+(\S+)\s+import\s+(.+)/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // ── Imports ──────────────────────────────────────────────────────
      const fromMatch = fromImportRegex.exec(line);
      if (fromMatch) {
        const module = fromMatch[1];
        const specifiers = fromMatch[2]
          .replace(/[()]/g, '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        imports.push({ source: module, specifiers, isDefault: false, isDynamic: false });
        continue;
      }

      const importMatch = importRegex.exec(line);
      if (importMatch && !line.includes('from')) {
        const modules = importMatch[1].split(',').map((m) => m.trim().split(' as ')[0]);
        for (const mod of modules) {
          imports.push({ source: mod, specifiers: [], isDefault: false, isDynamic: false });
        }
        continue;
      }

      // ── Classes ──────────────────────────────────────────────────────
      const classMatch = classRegex.exec(line);
      if (classMatch) {
        if (currentClass) classes.push(currentClass);
        const indent = classMatch[1].length;
        const name = classMatch[2];
        const bases = classMatch[3]
          ? classMatch[3].split(',').map((b) => b.trim()).filter(Boolean)
          : [];

        currentClass = {
          name,
          startLine: lineNum,
          endLine: lineNum,
          methods: [],
          properties: [],
          superClass: bases[0],
          interfaces: bases.slice(1),
          isExported: !name.startsWith('_'),
        };
        currentClassIndent = indent;
        continue;
      }

      // ── Functions / Methods ───────────────────────────────────────────
      const fnMatch = fnRegex.exec(line);
      if (fnMatch) {
        if (currentFunction) {
          currentFunction.fn.endLine = lineNum - 1;
          if (currentClass && currentFunction.indent > currentClassIndent) {
            currentClass.methods.push(currentFunction.fn);
          } else {
            functions.push(currentFunction.fn);
          }
        }

        const indent = fnMatch[1].length;
        const name = fnMatch[2];
        const params = fnMatch[3]
          .split(',')
          .map((p) => p.trim().split(':')[0].split('=')[0].trim())
          .filter((p) => p && p !== 'self' && p !== 'cls');
        const isAsync = line.includes('async def');

        const fn: ParsedFunction = {
          name,
          startLine: lineNum,
          endLine: lineNum,
          parameters: params,
          isAsync,
          isExported: !name.startsWith('_'),
          complexity: 1,
        };
        currentFunction = { fn, indent };
        continue;
      }

      // Close function/class if dedented
      if (currentFunction) {
        const lineIndent = line.match(/^(\s*)/)?.[1].length ?? 0;
        if (line.trim() && lineIndent <= currentFunction.indent) {
          currentFunction.fn.endLine = lineNum - 1;
          if (currentClass && currentFunction.indent > currentClassIndent) {
            currentClass.methods.push(currentFunction.fn);
          } else {
            functions.push(currentFunction.fn);
          }
          currentFunction = null;
        }
      }

      if (currentClass) {
        const lineIndent = line.match(/^(\s*)/)?.[1].length ?? 0;
        if (line.trim() && lineIndent <= currentClassIndent && lineNum > currentClass.startLine) {
          currentClass.endLine = lineNum - 1;
          classes.push(currentClass);
          currentClass = null;
          currentClassIndent = -1;
        }
      }
    }

    // Flush pending
    if (currentFunction) {
      currentFunction.fn.endLine = lines.length;
      if (currentClass) currentClass.methods.push(currentFunction.fn);
      else functions.push(currentFunction.fn);
    }
    if (currentClass) {
      currentClass.endLine = lines.length;
      classes.push(currentClass);
    }

    return {
      functions,
      classes,
      imports,
      exports: functions
        .filter((f) => f.isExported)
        .map((f) => f.name)
        .concat(classes.filter((c) => c.isExported).map((c) => c.name)),
      dependencies: imports.map((i) => i.source),
      complexity: functions.reduce((sum, f) => sum + f.complexity, 1),
      linesOfCode: lines.length,
    };
  }
}
