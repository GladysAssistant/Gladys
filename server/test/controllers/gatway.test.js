const { expect } = require('chai');

const { EVENTS } = require('../../utils/constants');

describe('Gladys Gateway call', () => {
  it('should call API route threw Gladys Gateway', (done) => {
    const user = {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      firstname: 'John',
      lastname: 'Doe',
      selector: 'john',
      email: 'demo@demo.com',
      language: 'en',
    };
    // @ts-ignore
    global.TEST_GLADYS_INSTANCE.event.emit(
      EVENTS.GATEWAY.NEW_MESSAGE_API_CALL,
      user,
      'GET',
      '/api/v1/me',
      {},
      {},
      (data) => {
        expect(data).to.have.property('id', '0cd30aef-9c4e-4a23-88e3-3547971296e5');
        expect(data).to.have.property('firstname');
        expect(data).to.have.property('selector', 'john');
        done();
      },
    );
  });
  it('should call unknown API route with Gladys Gateway', (done) => {
    const user = {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      firstname: 'John',
      lastname: 'Doe',
      selector: 'john',
      email: 'demo@demo.com',
      language: 'en',
    };
    // @ts-ignore
    global.TEST_GLADYS_INSTANCE.event.emit(
      EVENTS.GATEWAY.NEW_MESSAGE_API_CALL,
      user,
      'GET',
      '/api/v1/unksjdfldsjfkljdlksjfkdsjflk',
      {},
      {},
      (data) => {
        expect(data).to.have.property('status', 404);
        expect(data).to.have.property('code', 'NOT_FOUND');
        done();
      },
    );
  });
  it('should call errored API route with Gladys Gateway', (done) => {
    const user = {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      firstname: 'John',
      lastname: 'Doe',
      selector: 'john',
      email: 'demo@demo.com',
      language: 'en',
    };
    // @ts-ignore
    global.TEST_GLADYS_INSTANCE.event.emit(
      EVENTS.GATEWAY.NEW_MESSAGE_API_CALL,
      user,
      'GET',
      '/api/v1/dashboard/unknwnow-dashboard',
      {},
      {},
      (data) => {
        expect(data).to.have.property('status', 404);
        done();
      },
    );
  });
});
