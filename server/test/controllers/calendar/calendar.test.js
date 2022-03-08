const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

describe('POST /api/v1/calendar', () => {
  it('should create calendar', async () => {
    await authenticatedRequest
      .post('/api/v1/calendar')
      .send({
        name: 'my calendar',
        description: 'This is a great calendar',
      })
      .expect('Content-Type', /json/)
      .expect(201)
      .then((res) => {
        expect(res.body).to.have.property('name', 'my calendar');
        expect(res.body).to.have.property('description', 'This is a great calendar');
      });
  });
});

describe('PATCH /api/v1/calendar/:calendar_selector', () => {
  it('should update a calendar', async () => {
    await authenticatedRequest
      .patch('/api/v1/calendar/test-calendar')
      .send({
        name: 'new name',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('name', 'new name');
      });
  });
});

describe('DELETE /api/v1/calendar/:calendar_selector', () => {
  it('should delete a calendar', async () => {
    await authenticatedRequest
      .delete('/api/v1/calendar/test-calendar')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('success', true);
      });
  });
});

describe('POST /api/v1/calendar/:calendar_selector/event', () => {
  it('should create an event', async () => {
    await authenticatedRequest
      .post('/api/v1/calendar/test-calendar/event')
      .send({
        name: 'a new event',
        start: '2019-02-12 07:49:07.556',
      })
      .expect('Content-Type', /json/)
      .expect(201)
      .then((res) => {
        expect(res.body).to.have.property('name', 'a new event');
      });
  });
});

describe('PATCH /api/v1/calendar/event/:calendar_event_selector', () => {
  it('should update a calendar event', async () => {
    await authenticatedRequest
      .patch('/api/v1/calendar/event/test-calendar-event')
      .send({
        name: 'new name',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('name', 'new name');
      });
  });
});

describe('DELETE /api/v1/calendar/event/:calendar_event_selector', () => {
  it('should delete a calendar event', async () => {
    await authenticatedRequest
      .delete('/api/v1/calendar/event/test-calendar-event')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('success', true);
      });
  });
});

describe('GET /api/v1/calendar', () => {
  it('should GET all calendars', async () => {
    await authenticatedRequest
      .get('/api/v1/calendar')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        res.body.forEach((calendar) => {
          expect(calendar).to.have.property('name');
          expect(calendar).to.have.property('description');
          expect(calendar).to.have.property('user_id', '0cd30aef-9c4e-4a23-88e3-3547971296e5');
          expect(calendar).to.have.property('sync');
          expect(calendar).to.have.property('notify');
        });
      });
  });
  it('should GET only shared calendars', async () => {
    await authenticatedRequest
      .get('/api/v1/calendar?shared=true')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        res.body.forEach((calendar) => {
          expect(calendar).to.have.property('name');
          expect(calendar).to.have.property('description');
          expect(calendar).to.have.property('user_id', '0cd30aef-9c4e-4a23-88e3-3547971296e5');
          expect(calendar).to.have.property('sync');
          expect(calendar).to.have.property('shared', true);
          expect(calendar).to.have.property('notify');
        });
      });
  });
  it('should GET only private calendars', async () => {
    await authenticatedRequest
      .get('/api/v1/calendar?shared=false')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        res.body.forEach((calendar) => {
          expect(calendar).to.have.property('name');
          expect(calendar).to.have.property('description');
          expect(calendar).to.have.property('user_id', '0cd30aef-9c4e-4a23-88e3-3547971296e5');
          expect(calendar).to.have.property('sync');
          expect(calendar).to.have.property('shared', false);
          expect(calendar).to.have.property('notify');
        });
      });
  });
});

describe('GET /api/v1/calendar/event', () => {
  it('should GET all calendar events', async () => {
    await authenticatedRequest
      .get('/api/v1/calendar/event')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        res.body.forEach((calendar) => {
          expect(calendar).to.have.property('name');
          expect(calendar).to.have.property('calendar');
          expect(calendar).to.have.property('start');
          expect(calendar).to.have.property('end');
        });
      });
  });
});
