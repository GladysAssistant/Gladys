import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';
import preact from '@preact/preset-vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { patchCssModules } from 'vite-css-modules';
import { resolve } from 'path';
import { preactCliCssModules } from './vite-plugins/preact-cli-css-modules.js';

function treatJsFilesAsJsx() {
  return {
    name: 'treat-js-files-as-jsx',
    enforce: 'pre',
    async transform(code, id) {
      if (!/\/src\/.*\.js$/.test(id)) {
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
    definitions[`process.env.${key}`] = JSON.stringify(env[key]);
    return definitions;
  }, {});

  return {
    plugins: [
      patchCssModules({ exportMode: 'both' }),
      treatJsFilesAsJsx(),
      preactCliCssModules(),
      preact(),
      viteStaticCopy({
        targets: [
          { src: 'src/assets', dest: 'assets' },
          { src: 'src/manifest.json', dest: '.' }
        ]
      })
    ],
    resolve: {
      alias: {
        react: 'preact/compat',
        'react-dom/test-utils': 'preact/test-utils',
        'react-dom': 'preact/compat',
        '/assets': resolve(__dirname, 'src/assets')
      }
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
      ...processEnvDefine
    },
    server: {
      port: 1444,
      strictPort: true,
      fs: {
        allow: ['..']
      }
    },
    preview: {
      port: 8080
    },
    optimizeDeps: {
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
      target: 'es2022',
      sourcemap: true,
      commonjsOptions: {
        include: [/node_modules/, /server\//],
        transformMixedEsModules: true
      }
    },
    esbuild: {
      target: 'es2022',
      jsx: 'automatic',
      jsxImportSource: 'preact'
    }
  };
});
