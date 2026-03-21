import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { glob } from 'glob';
import { v4 as uuidv4 } from 'uuid';
import {
  FileAnalysis,
  SUPPORTED_LANGUAGES,
  EXCLUDED_DIRECTORIES,
  EXCLUDED_FILE_PATTERNS,
  logger,
} from '@ace/shared';
import { JavaScriptParser } from '../parsers/javascript.parser';
import { PythonParser } from '../parsers/python.parser';

const jsParser = new JavaScriptParser();
const pyParser = new PythonParser();

interface ParseResult {
  fileId: string;
  repositoryId: string;
  filePath: string;
  language: string;
  analysis: Partial<FileAnalysis>;
  size: number;
  linesOfCode: number;
  contentHash: string;
  name: string;
  extension: string;
}

const EXT_TO_LANG: Record<string, string> = {};
for (const [lang, exts] of Object.entries(SUPPORTED_LANGUAGES)) {
  for (const ext of exts) EXT_TO_LANG[ext] = lang;
}

export class ParserService {
  async parseRepository(
    repositoryId: string,
    localPath: string,
    onProgress?: (parsed: number, total: number) => void
  ): Promise<ParseResult[]> {
    const filePattern = path.join(localPath, '**', '*');
    const allFiles = await glob(filePattern, {
      nodir: true,
      follow: false,
      ignore: [...EXCLUDED_DIRECTORIES].map((d) => `**/${d}/**`),
    });

    // Filter to supported languages and not excluded patterns
    const validFiles = allFiles.filter((f) => {
      const ext = path.extname(f).toLowerCase();
      if (!EXT_TO_LANG[ext]) return false;
      const relative = path.relative(localPath, f);
      if (EXCLUDED_FILE_PATTERNS.some((r) => r.test(relative))) return false;
      return true;
    });

    const results: ParseResult[] = [];
    let parsed = 0;

    for (const filePath of validFiles) {
      try {
        const result = await this.parseFile(repositoryId, localPath, filePath);
        if (result) results.push(result);
        onProgress?.(++parsed, validFiles.length);
      } catch (err) {
        logger.warn({ err, filePath }, 'Failed to parse file — skipping');
        parsed++;
      }
    }

    logger.info(
      { repositoryId, total: validFiles.length, parsed: results.length },
      'Repository parsing complete'
    );
    return results;
  }

  async parseFile(
    repositoryId: string,
    localPath: string,
    absoluteFilePath: string
  ): Promise<ParseResult | null> {
    const ext = path.extname(absoluteFilePath).toLowerCase();
    const language = EXT_TO_LANG[ext];
    if (!language) return null;

    const relativePath = path.relative(localPath, absoluteFilePath);
    const content = await fs.readFile(absoluteFilePath, 'utf-8');

    // Skip binary-like files
    if (content.includes('\0')) return null;

    const contentHash = crypto.createHash('sha256').update(content).digest('hex');
    const size = Buffer.byteLength(content, 'utf-8');

    const analysis = await this.parseByLanguage(language, relativePath, content);

    return {
      fileId: uuidv4(),
      repositoryId,
      filePath: relativePath,
      language,
      analysis,
      size,
      linesOfCode: analysis.linesOfCode ?? content.split('\n').length,
      contentHash,
      name: path.basename(absoluteFilePath),
      extension: ext,
    };
  }

  private async parseByLanguage(
    language: string,
    filePath: string,
    content: string
  ): Promise<Partial<FileAnalysis>> {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return jsParser.parse(filePath, content);
      case 'python':
        return pyParser.parse(filePath, content);
      default:
        return this.genericParse(content);
    }
  }

  private genericParse(content: string): Partial<FileAnalysis> {
    return {
      functions: [],
      classes: [],
      imports: [],
      exports: [],
      dependencies: [],
      complexity: 1,
      linesOfCode: content.split('\n').length,
    };
  }
}
