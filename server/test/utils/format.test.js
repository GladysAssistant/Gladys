const { expect } = require('chai');
const { compareValue } = require('../../services/netatmo/lib/utils/format');

describe('utils/format.js', () => {
  describe('compareValue valid update - return true', () => {
    it('should get a valid update - with an integer', () => {
      const value = 1;
      const newValue = 2;

      const boolean = compareValue(value, newValue);
      expect(boolean).to.equal(true);
    });

    it('should get a valid update - with a boolean', () => {
      const value = true;
      const newValue = false;

      const boolean = compareValue(value, newValue);
      expect(boolean).to.equal(true);
    });

    it('should get a valid update - with a float', () => {
      const value = 2.1;
      const newValue = 2.3;

      const boolean = compareValue(value, newValue);
      expect(boolean).to.equal(true);
    });
  });
  describe('compareValue no update - return false', () => {
    it('should get a valid update - with an integer', () => {
      const value = 1;
      const newValue = 1;

      const boolean = compareValue(value, newValue);
      expect(boolean).to.equal(false);
    });

    it('should get a valid change update - with a boolean', () => {
      const value = true;
      const newValue = true;

      const boolean = compareValue(value, newValue);
      expect(boolean).to.equal(false);
    });

    it('should get a valid change update - with a float', () => {
      const value = 2.12;
      const newValue = 2.12;

      const boolean = compareValue(value, newValue);
      expect(boolean).to.equal(false);
    });
  });

  describe('compareValue with one value = null - no update - return false', () => {
    it('should get false because null', () => {
      const value = parseInt('1', 10);
      const newValue = null;

      const boolean = compareValue(value, newValue);
      expect(boolean).to.equal(false);
    });
  });
});
