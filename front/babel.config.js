// Project-wide babel config (applies to node_modules unlike .babelrc)
// Used to add syntax support for packages that ship modern JS not covered by the default preset
module.exports = {
  overrides: [
    {
      // reactflow UMD build uses optional chaining and nullish coalescing
      test: /node_modules\/reactflow\//,
      plugins: ['@babel/plugin-transform-optional-chaining', '@babel/plugin-transform-nullish-coalescing-operator']
    }
  ]
};
