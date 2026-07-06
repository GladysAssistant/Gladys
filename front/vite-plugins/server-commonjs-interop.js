import { readFileSync } from 'fs';
import { build } from 'esbuild';
import { resolve } from 'path';

const FRONT_ROOT = resolve(import.meta.dirname, '..');
const SERVER_ROOT = resolve(FRONT_ROOT, '../server');
const REPO_ROOT = resolve(FRONT_ROOT, '..');
const NODE_MODULE_PATHS = [resolve(FRONT_ROOT, 'node_modules'), resolve(SERVER_ROOT, 'node_modules')];

function normalizeId(id) {
  return id.split('?')[0];
}

function isServerModule(id) {
  const filePath = normalizeId(id);

  if (!filePath.endsWith('.js') || filePath.includes('node_modules')) {
    return false;
  }

  return filePath.startsWith(`${SERVER_ROOT}/`) || filePath.includes('/server/');
}

function parseExportEntries(body) {
  const names = [];
  let depth = 0;
  let current = '';

  const addName = trimmed => {
    if (!trimmed || trimmed.startsWith('//')) {
      return;
    }

    const shorthand = trimmed.match(/^(\w+)$/);
    if (shorthand) {
      names.push(shorthand[1]);
      return;
    }

    const explicit = trimmed.match(/^(\w+)\s*:/);
    if (explicit) {
      names.push(explicit[1]);
    }
  };

  for (const char of body) {
    if (char === '{' || char === '[' || char === '(') {
      depth += 1;
    } else if (char === '}' || char === ']' || char === ')') {
      depth -= 1;
    } else if (char === ',' && depth === 0) {
      addName(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  addName(current.trim());
  return names;
}

function getModuleExportsObjectBody(code) {
  const assignment = code.match(/module\.exports\s*=\s*\{/);
  if (!assignment) {
    return null;
  }

  let depth = 1;
  let index = assignment.index + assignment[0].length;

  while (index < code.length && depth > 0) {
    const char = code[index];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
    }
    index += 1;
  }

  if (depth !== 0) {
    return null;
  }

  return code.slice(assignment.index + assignment[0].length, index - 1);
}

function getCjsExportNames(code) {
  const names = new Set();

  for (const match of code.matchAll(/module\.exports\.(\w+)\s*=/g)) {
    names.add(match[1]);
  }

  for (const match of code.matchAll(/exports\.(\w+)\s*=/g)) {
    names.add(match[1]);
  }

  const objectExportBody = getModuleExportsObjectBody(code);
  if (objectExportBody) {
    for (const name of parseExportEntries(objectExportBody)) {
      names.add(name);
    }
  }

  return [...names];
}

function appendNamedExports(code, exportNames) {
  if (exportNames.length === 0) {
    return code;
  }

  const replaced = code.replace(/export default (require_\w+\(\));/, (_, initializer) => {
    const namedExports = exportNames.map(name => `export const ${name} = __cjsModule.${name};`).join('\n');
    return `const __cjsModule = ${initializer};\nexport default __cjsModule;\n${namedExports}`;
  });

  return replaced === code ? code : replaced;
}

/**
 * Vite dev serves files as native ESM, but the front imports many CommonJS modules
 * from ../server with named exports. Rollup's commonjs plugin alone leaves bare npm
 * imports (e.g. dayjs) in production bundles when server/node_modules is absent.
 * This plugin pre-bundles each server module with esbuild for dev and production.
 */
export function serverCommonjsInterop() {
  const cache = new Map();

  return {
    name: 'server-commonjs-interop',
    enforce: 'pre',
    async load(id) {
      if (!isServerModule(id)) {
        return null;
      }

      const filePath = normalizeId(id);
      if (cache.has(filePath)) {
        return cache.get(filePath);
      }

      const source = readFileSync(filePath, 'utf-8');
      if (!source.includes('module.exports') && !source.includes('exports.')) {
        return null;
      }

      const exportNames = getCjsExportNames(source);
      const result = await build({
        entryPoints: [filePath],
        write: false,
        bundle: true,
        format: 'esm',
        platform: 'node',
        absWorkingDir: REPO_ROOT,
        nodePaths: NODE_MODULE_PATHS,
        logLevel: 'silent'
      });

      const transformed = appendNamedExports(result.outputFiles[0].text, exportNames);
      cache.set(filePath, transformed);
      return transformed;
    }
  };
}
