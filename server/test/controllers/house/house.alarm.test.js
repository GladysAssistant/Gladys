const { expect } = require('chai');
const { authenticatedRequest, request, alarmModeToken } = require('../request.test');
const db = require('../../../models');
const passwordUtils = require('../../../utils/password');

const JOHN_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

describe('House.alarm', () => {
  it('should arm house in away mode', async () => {
    await authenticatedRequest
      .post('/api/v1/house/test-house/away_arm')
      .expect('Content-Type', /json/)
      .expect(200);
  });
  it('should arm house in night mode', async () => {
    await authenticatedRequest
      .post('/api/v1/house/test-house/night_arm')
      .expect('Content-Type', /json/)
      .expect(200);
  });
  it('should disarm house', async () => {
    const testHouse = await db.House.findOne({
      where: {
        selector: 'test-house',
      },
    });
    await testHouse.update({ alarm_mode: 'away-armed' });
    await authenticatedRequest
      .post('/api/v1/house/test-house/disarm')
      .expect('Content-Type', /json/)
      .expect(200);
  });
  it('should disarm house with code', async () => {
    const testHouse = await db.House.findOne({
      where: {
        selector: 'test-house',
      },
    });
    await testHouse.update({ alarm_mode: 'away-armed' });
    await db.AlarmCode.create({ user_id: JOHN_ID, code: await passwordUtils.hash('123456') });
    const res = await request
      .post('/api/v1/house/test-house/disarm_with_code')
      .set('Authorization', `Bearer ${alarmModeToken}`)
      .send({
        code: '123456',
        refresh_token: 'refresh-token-test',
      })
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body).to.have.property('alarm_mode', 'disarmed');
    const resSecondCall = await request
      .post('/api/v1/house/test-house/disarm_with_code')
      .set('Authorization', `Bearer ${alarmModeToken}`)
      .send({
        code: '123456',
        refresh_token: 'refresh-token-test',
      })
      .expect('Content-Type', /json/)
      .expect(200);
    expect(resSecondCall.body).to.have.property('alarm_mode', 'disarmed');
  });
  it('should not disarm with code, invalid code', async () => {
    const testHouse = await db.House.findOne({
      where: {
        selector: 'test-house',
      },
    });
    await testHouse.update({ alarm_mode: 'away-armed' });
    await db.AlarmCode.create({ user_id: JOHN_ID, code: await passwordUtils.hash('123456') });
    const res = await request
      .post('/api/v1/house/test-house/disarm_with_code')
      .set('Authorization', `Bearer ${alarmModeToken}`)
      .send({
        code: '12',
        refresh_token: 'refresh-token-test',
      })
      .expect('Content-Type', /json/)
      .expect(403);
    expect(res.body).to.deep.equal({ code: 'FORBIDDEN', message: 'INVALID_CODE', status: 403 });
  });
  it('should hit rate limit', async () => {
    const testHouse = await db.House.findOne({
      where: {
        selector: 'test-house',
      },
    });
    await testHouse.update({ alarm_mode: 'away-armed' });
    await db.AlarmCode.create({ user_id: JOHN_ID, code: await passwordUtils.hash('123456') });
    await request
      .post('/api/v1/house/test-house/disarm_with_code')
      .set('Authorization', `Bearer ${alarmModeToken}`)
      .send({
        code: '123456',
        refresh_token: 'refresh-token-test',
      })
      .expect('Content-Type', /json/)
      .expect(200);
    await request
      .post('/api/v1/house/test-house/disarm_with_code')
      .set('Authorization', `Bearer ${alarmModeToken}`)
      .send({
        code: '12',
        refresh_token: 'refresh-token-test',
      })
      .expect('Content-Type', /json/)
      .expect(403);
    await request
      .post('/api/v1/house/test-house/disarm_with_code')
      .set('Authorization', `Bearer ${alarmModeToken}`)
      .send({
        code: '12',
        refresh_token: 'refresh-token-test',
      })
      .expect('Content-Type', /json/)
      .expect(403);
    await request
      .post('/api/v1/house/test-house/disarm_with_code')
      .set('Authorization', `Bearer ${alarmModeToken}`)
      .send({
        code: '12',
        refresh_token: 'refresh-token-test',
      })
      .expect('Content-Type', /json/)
      .expect(403);
    const res = await request
      .post('/api/v1/house/test-house/disarm_with_code')
      .set('Authorization', `Bearer ${alarmModeToken}`)
      .send({
        code: '12',
        refresh_token: 'refresh-token-test',
      })
      .expect('Content-Type', /json/)
      .expect(429);
    expect(res.body).to.deep.equal({
      code: 'TOO_MANY_REQUESTS',
      status: 429,
      properties: { time_before_next: res.body.properties.time_before_next },
    });
  });
  it('should arm house in presence mode', async () => {
    await authenticatedRequest
      .post('/api/v1/house/test-house/presence_arm')
      .expect('Content-Type', /json/)
      .expect(200);
  });
  it('should put a house in panic mode', async () => {
    await authenticatedRequest
      .post('/api/v1/house/test-house/panic')
      .expect('Content-Type', /json/)
      .expect(200);
  });
});
