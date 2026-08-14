const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert } = sinon;

const { buildSupervisor } = require('./testUtils.test');

const buildCreatedDevice = (supportedOptions) => ({
  id: 'device-id',
  selector: 'my-camera',
  features: [
    {
      id: 'feature-id',
      selector: 'my-camera-preset',
      external_id: 'ext:demo:cam:preset',
      supported_options: supportedOptions,
    },
  ],
});

describe('externalIntegration.upsertFeatureSupportedOptions', () => {
  let externalIntegration;
  let device;

  beforeEach(() => {
    ({ externalIntegration, device } = buildSupervisor());
    device.syncFeatureSupportedOptions = sinon.fake.resolves([{ value: 1, label: 'Entrance', sort_order: 0 }]);
  });

  it('should sync the options and patch the in-memory feature', async () => {
    const createdDevice = buildCreatedDevice([{ value: 1, label: 'Old name', sort_order: 0 }]);
    const publishedOptions = [{ value: 1, label: 'Entrance', sort_order: 0 }];
    await externalIntegration.upsertFeatureSupportedOptions(createdDevice, [
      { external_id: 'ext:demo:cam:preset', supported_options: publishedOptions },
    ]);
    sinonAssert.calledWith(device.syncFeatureSupportedOptions, 'feature-id', publishedOptions);
    expect(createdDevice.features[0].supported_options).to.deep.equal([{ value: 1, label: 'Entrance', sort_order: 0 }]);
  });

  it('should sync when the created feature never had options', async () => {
    const createdDevice = buildCreatedDevice(undefined);
    await externalIntegration.upsertFeatureSupportedOptions(createdDevice, [
      { external_id: 'ext:demo:cam:preset', supported_options: [{ value: 1, label: 'Entrance', sort_order: 0 }] },
    ]);
    sinonAssert.calledOnce(device.syncFeatureSupportedOptions);
  });

  it('should sync when the number of options changed', async () => {
    const createdDevice = buildCreatedDevice([
      { value: 1, label: 'Entrance', sort_order: 0 },
      { value: 2, label: 'Garden', sort_order: 1 },
    ]);
    await externalIntegration.upsertFeatureSupportedOptions(createdDevice, [
      { external_id: 'ext:demo:cam:preset', supported_options: [{ value: 1, label: 'Entrance', sort_order: 0 }] },
    ]);
    sinonAssert.calledOnce(device.syncFeatureSupportedOptions);
  });

  it('should not sync when the options are unchanged', async () => {
    const createdDevice = buildCreatedDevice([{ value: 1, label: 'Entrance', sort_order: 0 }]);
    await externalIntegration.upsertFeatureSupportedOptions(createdDevice, [
      { external_id: 'ext:demo:cam:preset', supported_options: [{ value: 1, label: 'Entrance', sort_order: 0 }] },
    ]);
    sinonAssert.notCalled(device.syncFeatureSupportedOptions);
  });

  it('should skip published features without a supported_options array', async () => {
    const createdDevice = buildCreatedDevice([{ value: 1, label: 'Entrance', sort_order: 0 }]);
    await externalIntegration.upsertFeatureSupportedOptions(createdDevice, [{ external_id: 'ext:demo:cam:preset' }]);
    sinonAssert.notCalled(device.syncFeatureSupportedOptions);
  });

  it('should skip published features not created on the device', async () => {
    const createdDevice = buildCreatedDevice([{ value: 1, label: 'Entrance', sort_order: 0 }]);
    await externalIntegration.upsertFeatureSupportedOptions(createdDevice, [
      { external_id: 'ext:demo:cam:other', supported_options: [{ value: 9, label: 'Other', sort_order: 0 }] },
    ]);
    sinonAssert.notCalled(device.syncFeatureSupportedOptions);
  });

  it('should handle a created device without features', async () => {
    const createdDevice = { id: 'device-id', selector: 'my-camera' };
    await externalIntegration.upsertFeatureSupportedOptions(createdDevice, [
      { external_id: 'ext:demo:cam:preset', supported_options: [{ value: 1, label: 'Entrance', sort_order: 0 }] },
    ]);
    sinonAssert.notCalled(device.syncFeatureSupportedOptions);
  });
});
