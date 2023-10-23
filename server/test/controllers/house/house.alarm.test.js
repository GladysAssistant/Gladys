const { expect } = require('chai');
const { authenticatedRequest, request, alarmModeToken } = require('../request.test');
const db = require('../../../models');

describe('House.alarm', () => {
  it('should arm house', async () => {
    await authenticatedRequest
      .post('/api/v1/house/test-house/arm')
      .expect('Content-Type', /json/)
      .expect(200);
  });
  it('should disarm house', async () => {
    const testHouse = await db.House.findOne({
      where: {
        selector: 'test-house',
      },
    });
    await testHouse.update({ alarm_mode: 'armed' });
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
    await testHouse.update({ alarm_mode: 'armed', alarm_code: '123456' });
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
    await testHouse.update({ alarm_mode: 'armed', alarm_code: '123456' });
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
  it('should partially arm house', async () => {
    await authenticatedRequest
      .post('/api/v1/house/test-house/partial_arm')
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
