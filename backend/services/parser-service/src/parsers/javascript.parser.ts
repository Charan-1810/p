import { parse as babelParse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { FileAnalysis, ParsedFunction, ParsedClass, ParsedImport } from '@ace/shared';

export class JavaScriptParser {
  async parse(filePath: string, content: string): Promise<Partial<FileAnalysis>> {
    const isTypeScript =
      filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.mts');

    const ast = babelParse(content, {
      sourceType: 'unambiguous',
      errorRecovery: true,
      plugins: [
        ...(isTypeScript ? (['typescript'] as const) : []),
        'jsx',
        'decorators-legacy',
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
        'dynamicImport',
        'importMeta',
        'optionalChaining',
        'nullishCoalescingOperator',
      ],
    });

    const functions: ParsedFunction[] = [];
    const classes: ParsedClass[] = [];
    const imports: ParsedImport[] = [];
    const exports: string[] = [];
    let totalComplexity = 1;
    let functionCount = 0;

    traverse(ast, {
      // ── Imports ─────────────────────────────────────────────────────
      ImportDeclaration(nodePath) {
        const node = nodePath.node;
        const specifiers = node.specifiers.map((s) => {
          if (t.isImportDefaultSpecifier(s)) return 'default';
          if (t.isImportNamespaceSpecifier(s)) return '*';
          if (t.isImportSpecifier(s)) {
            return t.isIdentifier(s.imported) ? s.imported.name : String(s.imported.value);
          }
          return '';
        });
        imports.push({
          source: String(node.source.value),
          specifiers,
          isDefault: node.specifiers.some((s) => t.isImportDefaultSpecifier(s)),
          isDynamic: false,
        });
      },

      // ── Dynamic imports ──────────────────────────────────────────────
      CallExpression(nodePath) {
        const node = nodePath.node;
        if (t.isImport(node.callee) && node.arguments.length > 0) {
          const arg = node.arguments[0];
          if (t.isStringLiteral(arg)) {
            imports.push({
              source: arg.value,
              specifiers: [],
              isDefault: false,
              isDynamic: true,
            });
          }
        }
      },

      // ── Functions ────────────────────────────────────────────────────
      FunctionDeclaration(nodePath) {
        const node = nodePath.node;
        if (!node.id) return;

        const complexity = calculateComplexity(nodePath);
        totalComplexity += complexity;
        functionCount++;

        functions.push({
          name: node.id.name,
          startLine: node.loc?.start.line ?? 0,
          endLine: node.loc?.end.line ?? 0,
          parameters: node.params.map(getParamName),
          returnType: undefined,
          isAsync: node.async,
          isExported: isExportedNode(nodePath),
          complexity,
        });
      },

      ArrowFunctionExpression(nodePath) {
        const parent = nodePath.parent;
        let name = 'anonymous';

        if (
          t.isVariableDeclarator(parent) &&
          t.isIdentifier(parent.id)
        ) {
          name = parent.id.name;
        } else if (
          t.isAssignmentExpression(parent) &&
          t.isIdentifier(parent.left)
        ) {
          name = parent.left.name;
        } else {
          return; // Skip truly anonymous arrow fns
        }

        const node = nodePath.node;
        const complexity = calculateComplexity(nodePath);
        totalComplexity += complexity;
        functionCount++;

        functions.push({
          name,
          startLine: node.loc?.start.line ?? 0,
          endLine: node.loc?.end.line ?? 0,
          parameters: node.params.map(getParamName),
          isAsync: node.async,
          isExported: isExportedNode(nodePath),
          complexity,
        });
      },

      // ── Classes ──────────────────────────────────────────────────────
      ClassDeclaration(nodePath) {
        const node = nodePath.node;
        if (!node.id) return;

        const methods: ParsedFunction[] = [];
        for (const member of node.body.body) {
          if (t.isClassMethod(member) && t.isIdentifier(member.key)) {
            methods.push({
              name: member.key.name,
              startLine: member.loc?.start.line ?? 0,
              endLine: member.loc?.end.line ?? 0,
              parameters: member.params.map(getParamName),
              isAsync: member.async,
              isExported: false,
              complexity: 1,
            });
          }
        }

        classes.push({
          name: node.id.name,
          startLine: node.loc?.start.line ?? 0,
          endLine: node.loc?.end.line ?? 0,
          methods,
          properties: [],
          superClass: node.superClass && t.isIdentifier(node.superClass)
            ? node.superClass.name
            : undefined,
          interfaces: [],
          isExported: isExportedNode(nodePath),
        });
      },

      // ── Exports ──────────────────────────────────────────────────────
      ExportNamedDeclaration(nodePath) {
        const node = nodePath.node;
        if (t.isFunctionDeclaration(node.declaration) && node.declaration.id) {
          exports.push(node.declaration.id.name);
        } else if (t.isVariableDeclaration(node.declaration)) {
          for (const decl of node.declaration.declarations) {
            if (t.isIdentifier(decl.id)) exports.push(decl.id.name);
          }
        } else if (t.isClassDeclaration(node.declaration) && node.declaration.id) {
          exports.push(node.declaration.id.name);
        }
        for (const spec of node.specifiers) {
          if (t.isExportSpecifier(spec) && t.isIdentifier(spec.exported)) {
            exports.push(spec.exported.name);
          }
        }
      },

      ExportDefaultDeclaration() {
        exports.push('default');
      },
    });

    const avgComplexity = functionCount > 0 ? totalComplexity / functionCount : 1;

    return {
      functions,
      classes,
      imports,
      exports,
      dependencies: imports.map((i) => i.source),
      complexity: Math.round(avgComplexity),
      linesOfCode: content.split('\n').length,
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getParamName(param: t.Node): string {
  if (t.isIdentifier(param)) return param.name;
  if (t.isAssignmentPattern(param) && t.isIdentifier(param.left)) return `${param.left.name}?`;
  if (t.isRestElement(param) && t.isIdentifier(param.argument)) return `...${param.argument.name}`;
  if (t.isObjectPattern(param)) return '{...}';
  if (t.isArrayPattern(param)) return '[...]';
  return '_';
}

function isExportedNode(nodePath: NodePath): boolean {
  const parent = nodePath.parent;
  return (
    t.isExportNamedDeclaration(parent) ||
    t.isExportDefaultDeclaration(parent)
  );
}

function calculateComplexity(nodePath: NodePath): number {
  let complexity = 1;
  nodePath.traverse({
    IfStatement() { complexity++; },
    ConditionalExpression() { complexity++; },
    LogicalExpression(inner) {
      if (inner.node.operator === '&&' || inner.node.operator === '||') complexity++;
    },
    ForStatement() { complexity++; },
    ForInStatement() { complexity++; },
    ForOfStatement() { complexity++; },
    WhileStatement() { complexity++; },
    DoWhileStatement() { complexity++; },
    SwitchCase(inner) {
      if (inner.node.test) complexity++; // exclude default
    },
    CatchClause() { complexity++; },
  });
  return complexity;
}
