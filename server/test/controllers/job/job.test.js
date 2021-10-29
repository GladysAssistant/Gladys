const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

describe('GET /api/v1/job', () => {
  it('should get jobs', async () => {
    await authenticatedRequest
      .get('/api/v1/job')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        const jobs = res.body;
        expect(jobs).to.be.instanceOf(Array);
        jobs.forEach((oneJob) => {
          expect(oneJob).to.have.property('type');
        });
      });
  });
  it('should get jobs with take', async () => {
    await authenticatedRequest
      .get('/api/v1/job?take=0')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        const jobs = res.body;
        expect(jobs).to.be.instanceOf(Array);
        expect(jobs).to.have.lengthOf(0);
      });
  });
});
