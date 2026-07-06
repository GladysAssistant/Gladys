import { resolve, relative } from 'path';
import { fileURLToPath } from 'url';

const PLUGIN_QUERY = '?preact-async-route';
const ASYNC_LOADER_MODULE = '@preact/async-loader/async.js';
const ROUTE_ENTRY_PATTERN = /\/src\/routes\/(?:[^/]+\.(?:jsx?|tsx?)|[^/]+\/index\.(?:jsx?|tsx?))$/;

const cleanFilename = name => name.replace(/(^\/routes\/|(\/index)?\.[jt]sx?$)/g, '');

export function getRouteChunkName(filePath, srcRoot) {
  const relativePath = '/' + relative(srcRoot, filePath).replace(/\\/g, '/');
  if (!relativePath.startsWith('/routes/')) {
    return null;
  }
  return `route-${cleanFilename(relativePath)}`;
}

/**
 * Replicates preact-cli's @preact/async-loader behavior for route entry files.
 * Route entry files under src/routes/ are wrapped so their code loads on demand.
 */
export function preactAsyncRoutes({ srcRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../src') } = {}) {
  return {
    name: 'preact-async-routes',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!source.endsWith(PLUGIN_QUERY) || !importer) {
        return null;
      }

      const realSource = source.slice(0, -PLUGIN_QUERY.length);
      return this.resolve(realSource, importer, { skipSelf: true }).then(resolved => {
        if (!resolved) {
          return null;
        }
        return `${resolved.id}${PLUGIN_QUERY}`;
      });
    },
    transform(code, id) {
      if (id.includes(PLUGIN_QUERY)) {
        return null;
      }

      const [filePath] = id.split('?');

      if (!ROUTE_ENTRY_PATTERN.test(filePath)) {
        return null;
      }

      const chunkName = getRouteChunkName(filePath, srcRoot);
      if (!chunkName) {
        return null;
      }

      const moduleRequest = `./${relative(resolve(filePath, '..'), filePath).replace(/\\/g, '/')}${PLUGIN_QUERY}`;

      return {
        code: `
import async from ${JSON.stringify(ASYNC_LOADER_MODULE)};

function load(cb) {
  import(${JSON.stringify(moduleRequest)}).then(mod => {
    cb(mod);
  });
}

export default async(load);
`,
        map: null
      };
    }
  };
}
