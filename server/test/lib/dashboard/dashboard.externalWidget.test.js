const { expect } = require('chai');
const { DASHBOARD_BOX_TYPE } = require('../../../utils/constants');

const Dashboard = require('../../../lib/dashboard');

const USER_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

describe('dashboard model — external-widget box', () => {
  const dashboard = new Dashboard();

  const updateBoxes = (box) => dashboard.update(USER_ID, 'test-dashboard', { boxes: [{ columns: [[box]] }] });

  it('should save an external-widget box with its bounded settings', async () => {
    const box = {
      type: DASHBOARD_BOX_TYPE.EXTERNAL_WIDGET,
      integration: 'ext-tmdb',
      widget: 'upcoming_releases',
      name: 'Cinéma',
      settings: { period_days: '30', region: 'FR', notify: true, count: 3, devices: ['ext:a', 'ext:b'] },
    };
    const updated = await updateBoxes(box);
    expect(updated.boxes[0].columns[0][0]).to.deep.equal(box);
  });

  it('should save an external-widget box without settings or name', async () => {
    const box = { type: DASHBOARD_BOX_TYPE.EXTERNAL_WIDGET, integration: 'ext-tmdb', widget: 'upcoming_releases' };
    const updated = await updateBoxes(box);
    expect(updated.boxes[0].columns[0][0]).to.deep.equal(box);
  });

  it('should require the integration and the widget key, with the key shape', async () => {
    await expect(
      updateBoxes({ type: DASHBOARD_BOX_TYPE.EXTERNAL_WIDGET, widget: 'upcoming_releases' }),
    ).to.be.rejectedWith('.integration" is required');
    await expect(updateBoxes({ type: DASHBOARD_BOX_TYPE.EXTERNAL_WIDGET, integration: 'ext-tmdb' })).to.be.rejectedWith(
      '.widget" is required',
    );
    await expect(
      updateBoxes({ type: DASHBOARD_BOX_TYPE.EXTERNAL_WIDGET, integration: 'ext-tmdb', widget: 'Bad Key' }),
    ).to.be.rejectedWith('.widget" with value');
  });

  it('should bound the settings: keys, string length, serialized size, value types', async () => {
    const base = { type: DASHBOARD_BOX_TYPE.EXTERNAL_WIDGET, integration: 'ext-tmdb', widget: 'upcoming_releases' };
    const tooManyKeys = {};
    Array.from({ length: 11 }, (value, index) => index).forEach((index) => {
      tooManyKeys[`k${index}`] = 'v';
    });
    await expect(updateBoxes({ ...base, settings: tooManyKeys })).to.be.rejectedWith(
      '.settings" must have less than or equal to 10 keys',
    );
    await expect(updateBoxes({ ...base, settings: { region: 'x'.repeat(101) } })).to.be.rejectedWith(
      '.settings.region" length must be less than or equal to 100 characters long',
    );
    const tooBig = {};
    Array.from({ length: 10 }, (value, index) => index).forEach((index) => {
      tooBig[`k${index}`] = Array.from({ length: 30 }, () => 'abcd');
    });
    await expect(updateBoxes({ ...base, settings: tooBig })).to.be.rejectedWith('at most 1024 bytes');
    // 680 characters serialized but 1280 bytes: the bound counts UTF-8 bytes
    const multibyte = {};
    Array.from({ length: 10 }, (value, index) => index).forEach((index) => {
      multibyte[`k${index}`] = 'é'.repeat(60);
    });
    await expect(updateBoxes({ ...base, settings: multibyte })).to.be.rejectedWith('at most 1024 bytes');
    await expect(updateBoxes({ ...base, settings: { nested: { a: 1 } } })).to.be.rejectedWith('.settings.nested"');
  });

  it('should still reject unknown box keys and types', async () => {
    const base = { type: DASHBOARD_BOX_TYPE.EXTERNAL_WIDGET, integration: 'ext-tmdb', widget: 'upcoming_releases' };
    await expect(updateBoxes({ ...base, colour: 'red' })).to.be.rejectedWith('.colour" is not allowed');
    await expect(updateBoxes({ type: 'external-hologram' })).to.be.rejectedWith('.type" must be one of');
  });
});
