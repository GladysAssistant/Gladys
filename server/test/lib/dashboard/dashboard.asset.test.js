const { expect, assert } = require('chai');

const Dashboard = require('../../../lib/dashboard');

// 1x1 transparent PNG
const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('dashboard.createAsset', () => {
  const dashboard = new Dashboard();
  it('should create then read back an asset', async () => {
    const { id } = await dashboard.createAsset('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      content_type: 'image/png',
      data: PNG_BASE64,
    });
    expect(id).to.be.a('string');
    const asset = await dashboard.getAsset('0cd30aef-9c4e-4a23-88e3-3547971296e5', id);
    expect(asset).to.equal(`image/png;base64,${PNG_BASE64}`);
  });
  it('should reject a forbidden content type', async () => {
    const promise = dashboard.createAsset('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      content_type: 'image/svg+xml',
      data: PNG_BASE64,
    });
    return assert.isRejected(promise, 'not allowed');
  });
  it('should reject a missing data payload', async () => {
    const promise = dashboard.createAsset('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      content_type: 'image/png',
      data: '',
    });
    return assert.isRejected(promise, 'at most 4 MB');
  });
  it('should reject a payload over the base64 size bound', async () => {
    const promise = dashboard.createAsset('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      content_type: 'image/png',
      data: 'A'.repeat(4 * 1024 * 1024 + 1),
    });
    return assert.isRejected(promise, 'at most 4 MB');
  });
  it('should reject a non-base64 payload', async () => {
    const promise = dashboard.createAsset('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      content_type: 'image/png',
      data: 'not base64 at all!!',
    });
    return assert.isRejected(promise, 'valid base64');
  });
  it('should reject uploads past the per-dashboard cap', async () => {
    const dashboardRow = await dashboard.create('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      name: 'Asset cap dashboard',
      type: 'main',
      visibility: 'private',
      position: 0,
      boxes: [[]],
    });
    const db = require('../../../models');
    const rows = [];
    for (let i = 0; i < 25; i += 1) {
      rows.push({
        dashboard_id: dashboardRow.id,
        content_type: 'image/png',
        data: Buffer.from(PNG_BASE64, 'base64'),
      });
    }
    await db.DashboardAsset.bulkCreate(rows);
    const promise = dashboard.createAsset('0cd30aef-9c4e-4a23-88e3-3547971296e5', dashboardRow.selector, {
      content_type: 'image/png',
      data: PNG_BASE64,
    });
    return assert.isRejected(promise, 'already has 25 assets');
  });

  it('should delete the assets of a destroyed dashboard even without FK enforcement', async () => {
    const dashboardRow = await dashboard.create('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      name: 'Asset cleanup dashboard',
      type: 'main',
      visibility: 'private',
      position: 0,
      boxes: [[]],
    });
    await dashboard.createAsset('0cd30aef-9c4e-4a23-88e3-3547971296e5', dashboardRow.selector, {
      content_type: 'image/png',
      data: PNG_BASE64,
    });
    const db = require('../../../models');
    await dashboard.destroy('0cd30aef-9c4e-4a23-88e3-3547971296e5', dashboardRow.selector);
    const remaining = await db.DashboardAsset.count({ where: { dashboard_id: dashboardRow.id } });
    expect(remaining).to.equal(0);
  });

  it('should return not found on a dashboard I cannot edit', async () => {
    const promise = dashboard.createAsset('7a137a56-069e-4996-8816-36558174b727', 'test-dashboard', {
      content_type: 'image/png',
      data: PNG_BASE64,
    });
    return assert.isRejected(promise, 'Dashboard not found');
  });
});

describe('dashboard.getAsset', () => {
  const dashboard = new Dashboard();
  it('should return not found on an unknown asset', async () => {
    const promise = dashboard.getAsset('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'b21e1fbb-8bf5-45a2-9124-cc2d915ad324');
    return assert.isRejected(promise, 'Dashboard asset not found');
  });
  it('should return not found on an asset of a private dashboard of someone else', async () => {
    const { id } = await dashboard.createAsset('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      content_type: 'image/png',
      data: PNG_BASE64,
    });
    const promise = dashboard.getAsset('7a137a56-069e-4996-8816-36558174b727', id);
    return assert.isRejected(promise, 'Dashboard asset not found');
  });
});
