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

function getCjsExportNames(code) {
  const names = new Set();

  for (const match of code.matchAll(/module\.exports\.(\w+)\s*=/g)) {
    names.add(match[1]);
  }

  for (const match of code.matchAll(/exports\.(\w+)\s*=/g)) {
    names.add(match[1]);
  }

  const objectExportMatch = code.match(/module\.exports\s*=\s*\{([\s\S]*?)\n\};/);
  if (objectExportMatch) {
    for (const line of objectExportMatch[1].split('\n')) {
      const trimmed = line.trim().replace(/,$/, '');
      if (!trimmed || trimmed.startsWith('//')) {
        continue;
      }

      const shorthand = trimmed.match(/^(\w+)$/);
      if (shorthand) {
        names.add(shorthand[1]);
        continue;
      }

      const explicit = trimmed.match(/^(\w+)\s*:/);
      if (explicit) {
        names.add(explicit[1]);
      }
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
 * from ../server. Rollup handles those during production builds via commonjsOptions,
 * so this plugin only rewrites server modules for the dev server (Cypress, npm run dev).
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
