const { expect } = require('chai');

const { evaluate } = require('../../../lib/scene/scene.formula');

// Scene formulas are written by authenticated administrators, but they are persisted and then
// evaluated server-side, so the expression parser is the only thing standing between a stored
// string and the Node process. mathjs blocks property/method access on its own values; these
// probes are the escape shapes from the mathjs security test suite, kept here so that growing
// the allowed namespace (or upgrading mathjs) cannot quietly reopen the sandbox.
describe('scene.formula sandbox', () => {
  const ESCAPE_ATTEMPTS = [
    'round.constructor',
    'round["constructor"]',
    'round["\\u0063onstructor"]',
    'f=sqrt.constructor("1+1"); f()',
    'f(x)=x; f.constructor',
    '[].map.constructor',
    'sqrt.call',
    'sqrt.apply',
    'sqrt.bind',
    'obj={}; obj.constructor',
  ];

  ESCAPE_ATTEMPTS.forEach((formula) => {
    it(`should refuse to evaluate "${formula}"`, () => {
      expect(() => evaluate(formula)).to.throw();
    });
  });

  it('should not expose a function absent from the allowed namespace', () => {
    expect(() => evaluate('compareText("a","b")')).to.throw(/Undefined function/);
  });

  it('should still evaluate a legitimate formula', () => {
    expect(evaluate('round(min(15, sqrt(400)) * 60)')).to.equal(900);
  });
});
