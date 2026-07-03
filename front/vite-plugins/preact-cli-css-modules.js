import { readFileSync, existsSync } from 'fs';
import { resolve as resolvePath } from 'path';

/**
 * preact-cli treats `import style from './file.css'` as CSS modules, while
 * `import './file.css'` stays global. Vite only enables modules for
 * `*.module.css` by default.
 *
 * This plugin rewrites default CSS imports to virtual `.module.css` module IDs
 * so `vite-css-modules` can provide webpack-compatible default exports.
 */
export function preactCliCssModules() {
  const resolvedModules = new Map();

  return {
    name: 'preact-cli-css-modules',
    enforce: 'pre',
    transform(code, id) {
      if (!/\.(jsx?|tsx?)$/.test(id) || id.includes('node_modules')) {
        return null;
      }

      const updatedCode = code.replace(
        /import\s+(\w+)\s+from\s+(['"])([^'"]+\.css)\2/g,
        (match, binding, quote, cssPath) => {
          if (cssPath.includes('.module.css')) {
            return match;
          }
          return `import ${binding} from ${quote}${cssPath.replace(/\.css$/, '.module.css')}${quote}`;
        }
      );

      if (updatedCode === code) {
        return null;
      }

      return { code: updatedCode, map: null };
    },
    resolveId(source, importer) {
      if (!importer || !source.endsWith('.module.css') || source.includes('node_modules')) {
        return null;
      }

      const cssPath = source.replace(/\.module\.css$/, '.css');
      const absoluteCssPath = resolvePath(resolvePath(importer, '..'), cssPath);

      if (!existsSync(absoluteCssPath)) {
        return null;
      }

      const virtualModuleId = `${absoluteCssPath}.module.css`;
      resolvedModules.set(virtualModuleId, absoluteCssPath);
      return virtualModuleId;
    },
    load(id) {
      const absoluteCssPath = resolvedModules.get(id);
      if (!absoluteCssPath) {
        return null;
      }

      return readFileSync(absoluteCssPath, 'utf8');
    }
  };
}
