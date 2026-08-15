const {
  create,
  // Arithmetic operators
  addDependencies,
  subtractDependencies,
  multiplyDependencies,
  divideDependencies,
  unaryMinusDependencies,
  modDependencies,
  // Comparison operators (>, >=, <, <=)
  largerDependencies,
  largerEqDependencies,
  smallerDependencies,
  smallerEqDependencies,
  // Rounding and sign
  absDependencies,
  ceilDependencies,
  floorDependencies,
  fixDependencies,
  roundDependencies,
  signDependencies,
  // Powers and roots
  powDependencies,
  sqrtDependencies,
  cbrtDependencies,
  squareDependencies,
  cubeDependencies,
  nthRootDependencies,
  hypotDependencies,
  // Exponential and logarithm
  expDependencies,
  logDependencies,
  log2Dependencies,
  log10Dependencies,
  // Statistics
  minDependencies,
  maxDependencies,
  meanDependencies,
  medianDependencies,
  sumDependencies,
  prodDependencies,
  // Integer arithmetic
  gcdDependencies,
  lcmDependencies,
  // Random
  randomDependencies,
  randomIntDependencies,
  // Trigonometry
  sinDependencies,
  cosDependencies,
  tanDependencies,
  asinDependencies,
  acosDependencies,
  atanDependencies,
  atan2Dependencies,
  // Constants
  piDependencies,
  eDependencies,
  tauDependencies,
  // The expression parser itself
  evaluateDependencies,
} = require('mathjs');

// Every operator, function and constant the formula engine supports must be listed explicitly
// here. mathjs only exposes in the "math" namespace what is passed to create(), so a function
// that is only pulled in transitively by another factory (multiply through divide, or abs
// through round, for example) is not guaranteed to stay available across mathjs releases.
// Every entry below is covered by a test in test/lib/scene/actions/scene.action.formula.test.js
// so that a mathjs upgrade dropping one fails CI instead of failing silently in production.
const { evaluate } = create({
  addDependencies,
  subtractDependencies,
  multiplyDependencies,
  divideDependencies,
  unaryMinusDependencies,
  modDependencies,
  largerDependencies,
  largerEqDependencies,
  smallerDependencies,
  smallerEqDependencies,
  absDependencies,
  ceilDependencies,
  floorDependencies,
  fixDependencies,
  roundDependencies,
  signDependencies,
  powDependencies,
  sqrtDependencies,
  cbrtDependencies,
  squareDependencies,
  cubeDependencies,
  nthRootDependencies,
  hypotDependencies,
  expDependencies,
  logDependencies,
  log2Dependencies,
  log10Dependencies,
  minDependencies,
  maxDependencies,
  meanDependencies,
  medianDependencies,
  sumDependencies,
  prodDependencies,
  gcdDependencies,
  lcmDependencies,
  randomDependencies,
  randomIntDependencies,
  sinDependencies,
  cosDependencies,
  tanDependencies,
  asinDependencies,
  acosDependencies,
  atanDependencies,
  atan2Dependencies,
  piDependencies,
  eDependencies,
  tauDependencies,
  evaluateDependencies,
});

module.exports = {
  evaluate,
};
