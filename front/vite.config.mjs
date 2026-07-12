import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';
import preact from '@preact/preset-vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { patchCssModules } from 'vite-css-modules';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { preactCliCssModules } from './vite-plugins/preact-cli-css-modules.js';
import { preactAsyncRoutes, getRouteChunkName } from './vite-plugins/preact-async-routes.js';
import { serverCommonjsInterop } from './vite-plugins/server-commonjs-interop.js';

const FRONT_ROOT = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(FRONT_ROOT, 'src');

function treatJsFilesAsJsx() {
  return {
    name: 'treat-js-files-as-jsx',
    enforce: 'pre',
    async transform(code, id) {
      if (!/\/src\/.*\.js($|\?)/.test(id)) {
        return null;
      }

      return transformWithEsbuild(code, id, {
        loader: 'jsx',
        jsx: 'automatic',
        jsxImportSource: 'preact'
      });
    }
  };
}

const ENV_KEYS = [
  'GLADYS_GATEWAY_API_URL',
  'LOCAL_API_URL',
  'DEMO_MODE',
  'DEMO_REQUEST_TIME',
  'WEBSOCKET_URL',
  'GATEWAY_MODE',
  'STRIPE_API_KEY',
  'ENEDIS_FORCE_USAGE_POINTS'
];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const processEnvDefine = ENV_KEYS.reduce((definitions, key) => {
    // JSON.stringify(undefined) is not a string: replace unset variables with
    // the literal `undefined` so `process.env.X` expressions stay valid code.
    definitions[`process.env.${key}`] = env[key] === undefined ? 'undefined' : JSON.stringify(env[key]);
    return definitions;
  }, {});

  const plugins = [
    serverCommonjsInterop(),
    patchCssModules({ exportMode: 'both' }),
    preactAsyncRoutes({ srcRoot: SRC_ROOT }),
    treatJsFilesAsJsx(),
    preactCliCssModules(),
    preact(),
    viteStaticCopy({
      targets: [
        // Copy static asset contents into build/assets/ (not build/assets/assets/).
        { src: 'src/assets/**/*', dest: 'assets' },
        { src: 'src/manifest.json', dest: '.' }
      ]
    })
  ];

  return {
    plugins,
    resolve: {
      alias: {
        react: 'preact/compat',
        'react-dom/test-utils': 'preact/test-utils',
        'react-dom': 'preact/compat',
        '/assets': resolve(FRONT_ROOT, 'src/assets')
      }
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
      ...processEnvDefine
    },
    server: {
      port: 1444,
      strictPort: true,
      // preact-cli exposed the dev server on the network (0.0.0.0): keep that
      // behavior so the dev front stays reachable from another device (tablet,
      // phone) or through WSL2 port forwarding. Vite only binds localhost by default.
      host: true,
      // The server advertises this name on the local network with mDNS.
      allowedHosts: ['gladysassistant.local'],
      fs: {
        allow: ['..']
      },
      // Transform the whole app on startup instead of on first request:
      // the app is one large SPA and every page load pulls in most of it.
      warmup: {
        clientFiles: ['./src/main.jsx']
      }
    },
    preview: {
      port: 8080
    },
    optimizeDeps: {
      // Injected by the preact-async-routes plugin: the dependency scanner cannot
      // discover it, and a dependency discovered after startup makes the dev server
      // reload every open page (breaks Cypress runs).
      include: ['@preact/async-loader/async.js'],
      esbuildOptions: {
        loader: {
          '.js': 'jsx'
        },
        jsx: 'automatic',
        jsxImportSource: 'preact'
      }
    },
    build: {
      outDir: 'build',
      // preact-cli shipped a legacy nomodule bundle next to the modern one.
      // Vite only emits one bundle: lower its floor so older wall-mounted
      // tablets (Safari 13 / old Chromium webviews) keep working.
      target: ['es2019', 'chrome79', 'edge79', 'firefox72', 'safari13'],
      sourcemap: true,
      rollupOptions: {
        output: {
          chunkFileNames: chunkInfo => {
            // Name route chunks after their route path (like preact-cli did),
            // e.g. src/routes/dashboard/index.js -> assets/route-dashboard.chunk.<hash>.js
            const facadeModuleId = (chunkInfo.facadeModuleId || '').split('?')[0];
            const routeChunkName = facadeModuleId ? getRouteChunkName(facadeModuleId, SRC_ROOT) : null;
            if (routeChunkName) {
              return `assets/${routeChunkName}.chunk.[hash].js`;
            }
            return 'assets/[name].chunk.[hash].js';
          }
        }
      },
      commonjsOptions: {
        include: [/node_modules/, /server\//],
        transformMixedEsModules: true
      }
    },
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'preact'
    }
  };
});
