const { expect } = require('chai');

const { isSensorFeature, isHistoryFeature } = require('../../../../services/mcp/lib/selectFeature');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

describe('mcp selectFeature flow-sensor', () => {
  const flow = { category: DEVICE_FEATURE_CATEGORIES.FLOW_SENSOR, type: DEVICE_FEATURE_TYPES.FLOW_SENSOR.DECIMAL };

  it('should give the assistant the state of a flow sensor', () => {
    expect(isSensorFeature(flow)).to.equal(true);
  });

  it('should give the assistant the history of a flow sensor that keeps it', () => {
    expect(isHistoryFeature({ ...flow, keep_history: true })).to.equal(true);
  });
});
