const { expect } = require('chai');

const { authenticatedRequest, nonAdminRequest, NON_ADMIN_USER_ID } = require('../request.test');
const db = require('../../../models');
const passwordUtils = require('../../../utils/password');
const { USER_ROLE } = require('../../../utils/constants');

const JOHN_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

const seedNonAdminUser = () =>
  db.User.create({
    id: NON_ADMIN_USER_ID,
    firstname: 'Pepper',
    lastname: 'Potts',
    selector: 'pepper-habitant',
    email: 'pepper-habitant@pots.com',
    password: 'mysuperpassword',
    role: USER_ROLE.HABITANT,
    language: 'en',
    birthdate: '1990-12-12',
  });

describe('GET /api/v1/alarm_code', () => {
  it('should list the codes without their hash', async () => {
    await db.AlarmCode.create({ user_id: JOHN_ID, code: await passwordUtils.hash('1234') });

    const res = await authenticatedRequest
      .get('/api/v1/alarm_code')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).to.have.lengthOf(1);
    expect(res.body[0]).to.have.property('user_id', JOHN_ID);
    expect(res.body[0]).to.not.have.property('code');
  });
  it('should not be readable by a non-admin', async () => {
    await seedNonAdminUser();
    await nonAdminRequest.get('/api/v1/alarm_code').expect(403);
  });
});

describe('POST /api/v1/alarm_code', () => {
  it('should create a guest code', async () => {
    const res = await authenticatedRequest
      .post('/api/v1/alarm_code')
      .send({ name: 'Home help', code: '4321' })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(res.body).to.have.property('name', 'Home help');
    expect(res.body).to.not.have.property('code');
  });
  it('should refuse a code of the wrong shape', async () => {
    await authenticatedRequest
      .post('/api/v1/alarm_code')
      .send({ name: 'Home help', code: '43' })
      .expect(400);
  });
  it('should refuse a code somebody else already uses', async () => {
    await db.AlarmCode.create({ user_id: JOHN_ID, code: await passwordUtils.hash('4321') });

    await authenticatedRequest
      .post('/api/v1/alarm_code')
      .send({ name: 'Home help', code: '4321' })
      .expect(409);
  });
  it('should not be creatable by a non-admin', async () => {
    await seedNonAdminUser();
    await nonAdminRequest
      .post('/api/v1/alarm_code')
      .send({ name: 'Home help', code: '4321' })
      .expect(403);
  });
});

describe('DELETE /api/v1/alarm_code/:alarm_code_id', () => {
  it('should revoke a code', async () => {
    const code = await db.AlarmCode.create({ name: 'Home help', code: await passwordUtils.hash('4321') });

    const res = await authenticatedRequest
      .delete(`/api/v1/alarm_code/${code.id}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).to.deep.equal({ success: true });
    expect(await db.AlarmCode.count()).to.equal(0);
  });
  it('should return 404 on a code that does not exist', async () => {
    await authenticatedRequest.delete('/api/v1/alarm_code/e5c1d94a-bd8f-4ad4-8dc0-c0e0f6e9f2f4').expect(404);
  });
  it('should refuse to revoke the personal code of a user', async () => {
    const code = await db.AlarmCode.create({ user_id: JOHN_ID, code: await passwordUtils.hash('1234') });

    const res = await authenticatedRequest.delete(`/api/v1/alarm_code/${code.id}`).expect(403);

    expect(res.body).to.have.property('message', 'PERSONAL_ALARM_CODE');
    expect(await db.AlarmCode.count()).to.equal(1);
  });
  it('should not be revocable by a non-admin', async () => {
    await seedNonAdminUser();
    const code = await db.AlarmCode.create({ name: 'Home help', code: await passwordUtils.hash('4321') });
    await nonAdminRequest.delete(`/api/v1/alarm_code/${code.id}`).expect(403);
  });
});

describe('My own alarm code', () => {
  it('should say my code is not set', async () => {
    const res = await authenticatedRequest
      .get('/api/v1/me/alarm_code')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).to.deep.equal({ defined: false });
  });
  it('should set, report then delete my own code', async () => {
    const setRes = await authenticatedRequest
      .patch('/api/v1/me/alarm_code')
      .send({ code: '1234' })
      .expect('Content-Type', /json/)
      .expect(200);
    expect(setRes.body).to.have.property('id');

    const getRes = await authenticatedRequest.get('/api/v1/me/alarm_code').expect(200);
    expect(getRes.body).to.deep.equal({ defined: true });

    const deleteRes = await authenticatedRequest.delete('/api/v1/me/alarm_code').expect(200);
    expect(deleteRes.body).to.deep.equal({ success: true });
    expect(await db.AlarmCode.count({ where: { user_id: JOHN_ID } })).to.equal(0);
  });
  it('should let a non-admin manage their own code', async () => {
    await seedNonAdminUser();

    await nonAdminRequest
      .patch('/api/v1/me/alarm_code')
      .send({ code: '4321' })
      .expect(200);

    const res = await nonAdminRequest.get('/api/v1/me/alarm_code').expect(200);
    expect(res.body).to.deep.equal({ defined: true });
  });
});
