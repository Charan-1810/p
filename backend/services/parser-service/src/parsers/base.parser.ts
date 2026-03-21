import path from 'path';
import fs from 'fs/promises';
import {
  FileAnalysis,
  ParsedFunction,
  ParsedClass,
  ParsedImport,
  SUPPORTED_LANGUAGES,
  EXCLUDED_DIRECTORIES,
  EXCLUDED_FILE_PATTERNS,
  logger,
} from '@ace/shared';
import { JavaScriptParser } from './javascript.parser';
import { PythonParser } from './python.parser';

type IParser = {
  parse(filePath: string, content: string): Promise<Partial<FileAnalysis>>;
};

const PARSER_MAP: Record<string, IParser> = {
  javascript: new JavaScriptParser(),
  typescript: new JavaScriptParser(), // babel handles both
  python: new PythonParser(),
};

export class RepositoryParser {
  async parseRepository(
    repositoryId: string,
    localPath: string,
    onProgress?: (percent: number, filesProcessed: number, totalFiles: number) => void
  ): Promise<FileAnalysis[]> {
    const allFiles = await this.collectFiles(localPath);
    const results: FileAnalysis[] = [];
    const total = allFiles.length;

    logger.info({ repositoryId, total }, 'Starting repository parse');

    for (let i = 0; i < allFiles.length; i++) {
      const filePath = allFiles[i];
      const relPath = path.relative(localPath, filePath);
      const lang = this.detectLanguage(filePath);

      if (!lang) {
        continue;
      }

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const analysis = await this.parseFile({
          repositoryId,
          filePath: relPath,
          fullPath: filePath,
          language: lang,
          content,
        });
        results.push(analysis);
      } catch (err) {
        logger.warn({ filePath: relPath, err }, 'Failed to parse file, skipping');
      }

      if (onProgress && (i + 1) % 10 === 0) {
        onProgress(Math.round(((i + 1) / total) * 100), i + 1, total);
      }
    }

    logger.info({ repositoryId, parsed: results.length, skipped: total - results.length }, 'Parser complete');
    return results;
  }

  async parseFile(opts: {
    repositoryId: string;
    filePath: string;
    fullPath: string;
    language: string;
    content: string;
  }): Promise<FileAnalysis> {
    const { repositoryId, filePath, language, content } = opts;
    const parser = PARSER_MAP[language];
    const linesOfCode = content.split('\n').length;

    const base: FileAnalysis = {
      fileId: '', // Will be set after DB upsert
      repositoryId,
      filePath,
      language,
      functions: [],
      classes: [],
      imports: [],
      exports: [],
      dependencies: [],
      complexity: 1,
      linesOfCode,
      analyzedAt: new Date(),
    };

    if (!parser) {
      return base; // Unsupported language — return basic info
    }

    try {
      const parsed = await parser.parse(filePath, content);
      return { ...base, ...parsed };
    } catch (err) {
      logger.warn({ filePath, language, err }, 'Parser error, returning basic analysis');
      return base;
    }
  }

  private async collectFiles(rootPath: string): Promise<string[]> {
    const results: string[] = [];
    await this.walkDir(rootPath, results);
    return results;
  }

  private async walkDir(dirPath: string, results: string[]): Promise<void> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (EXCLUDED_DIRECTORIES.has(entry.name) || entry.name.startsWith('.')) {
          continue;
        }
        await this.walkDir(fullPath, results);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!ext) continue;
        if (EXCLUDED_FILE_PATTERNS.some((p) => p.test(entry.name))) continue;

        const lang = this.detectLanguageByExt(ext);
        if (lang) {
          const stat = await fs.stat(fullPath);
          if (stat.size < 10 * 1024 * 1024) { // Skip files > 10MB
            results.push(fullPath);
          }
        }
      }
    }
  }

  detectLanguage(filePath: string): string | null {
    const ext = path.extname(filePath).toLowerCase();
    return this.detectLanguageByExt(ext);
  }

  private detectLanguageByExt(ext: string): string | null {
    for (const [lang, exts] of Object.entries(SUPPORTED_LANGUAGES)) {
      if (exts.includes(ext)) return lang;
    }
    return null;
  }
}
