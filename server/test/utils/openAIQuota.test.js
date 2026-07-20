const { expect } = require('chai');

const { formatResetDuration, getQuotaProgressBarClass, getQuotaUsedPercent } = require('../../utils/openAIQuota');

describe('openAIQuota utils', () => {
  describe('formatResetDuration', () => {
    it('should return empty string for zero or negative values', () => {
      expect(formatResetDuration(0)).to.equal('');
      expect(formatResetDuration(-10)).to.equal('');
      expect(formatResetDuration(null)).to.equal('');
      expect(formatResetDuration(undefined)).to.equal('');
    });

    it('should format seconds only', () => {
      expect(formatResetDuration(45, 'en')).to.equal('45s');
      expect(formatResetDuration(45, 'fr')).to.equal('45s');
    });

    it('should format minutes and seconds', () => {
      expect(formatResetDuration(125, 'en')).to.equal('2min 5s');
    });

    it('should format hours, minutes and seconds', () => {
      expect(formatResetDuration(3661, 'en')).to.equal('1h 1min 1s');
    });

    it('should format hours without trailing seconds', () => {
      expect(formatResetDuration(3600, 'en')).to.equal('1h');
    });

    it('should format days', () => {
      expect(formatResetDuration(90061, 'de')).to.equal('1T 1Std 1Min 1Sek');
    });

    it('should fallback to english labels for unknown language', () => {
      expect(formatResetDuration(30, 'es')).to.equal('30s');
    });
  });

  describe('getQuotaUsedPercent', () => {
    it('should return 0 for invalid quota', () => {
      expect(getQuotaUsedPercent(null)).to.equal(0);
      expect(getQuotaUsedPercent({ remaining: 10, max: 0 })).to.equal(0);
    });

    it('should compute used percentage', () => {
      expect(getQuotaUsedPercent({ remaining: 75, max: 100 })).to.equal(25);
      expect(getQuotaUsedPercent({ remaining: 0, max: 100 })).to.equal(100);
    });

    it('should clamp percentage between 0 and 100', () => {
      expect(getQuotaUsedPercent({ remaining: 150, max: 100 })).to.equal(0);
      expect(getQuotaUsedPercent({ remaining: -10, max: 100 })).to.equal(100);
    });
  });

  describe('getQuotaProgressBarClass', () => {
    it('should return secondary for invalid quota', () => {
      expect(getQuotaProgressBarClass(null)).to.equal('bg-secondary');
      expect(getQuotaProgressBarClass({ remaining: 10, max: 0 })).to.equal('bg-secondary');
    });

    it('should return success when usage is below 80%', () => {
      expect(getQuotaProgressBarClass({ remaining: 30, max: 100 })).to.equal('bg-success');
    });

    it('should return warning when usage is at or above 80%', () => {
      expect(getQuotaProgressBarClass({ remaining: 15, max: 100 })).to.equal('bg-warning');
    });

    it('should return danger when quota is exhausted', () => {
      expect(getQuotaProgressBarClass({ remaining: 0, max: 100 })).to.equal('bg-danger');
    });
  });
});
