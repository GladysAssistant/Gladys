const { expect } = require('chai');
const { calculateDistanceBetweenTwoPoints } = require('../../utils/coordinates');

describe('calculateDistanceBetweenTwoPoints', () => {
  it('should calculate distance between 2 points', () => {
    const value = calculateDistanceBetweenTwoPoints(
      43.068887774169625,
      3.5002301619448417,
      48.10743118848039,
      4.203229745748899,
    );
    expect(value).to.equal(562918);
  });
  it('should calculate distance between 2 points', () => {
    const value = calculateDistanceBetweenTwoPoints(
      64.77412531292873,
      74.50318812615205,
      -41.66581108420415,
      -95.65893074555942,
    );
    expect(value).to.equal(17370593);
  });
  it('should calculate distance between same point', () => {
    const value = calculateDistanceBetweenTwoPoints(
      64.77412531292873,
      74.50318812615205,
      64.77412531292873,
      74.50318812615205,
    );
    expect(value).to.equal(0);
  });
});
