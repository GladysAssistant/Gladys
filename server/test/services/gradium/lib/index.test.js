const { expect } = require('chai');

const GradiumHandler = require('../../../../services/gradium/lib');
const { getTTSApiUrl } = require('../../../../services/gradium/lib/getTTSApiUrl');
const { getVoices } = require('../../../../services/gradium/lib/getVoices');

describe('GradiumHandler', () => {
  it('should initialize instance with expected properties and methods', () => {
    const gladys = {};
    const serviceId = 'f2660e4d-fc4e-4cb6-af0e-f281d00f00aa';

    const gradiumHandler = new GradiumHandler(gladys, serviceId);

    expect(gradiumHandler.gladys).to.equal(gladys);
    expect(gradiumHandler.serviceId).to.equal(serviceId);
    expect(gradiumHandler.basePath).to.equal('medias/gradium');
    expect(gradiumHandler.getTTSApiUrl).to.equal(getTTSApiUrl);
    expect(gradiumHandler.getVoices).to.equal(getVoices);
  });
});
