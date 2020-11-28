const { expect } = require('chai');
// const uuid = require('uuid');
// const fs = require('fs');
const { authenticatedRequest } = require('../request.test');

describe('POST /api/v1/device', () => {
  it('should create device', async () => {
    await authenticatedRequest
      .post('/api/v1/device')
      .send({
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        name: 'Philips Hue 1',
        external_id: 'philips-hue-new',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('selector', 'philips-hue-1');
        expect(res.body).to.have.property('features');
        expect(res.body).to.have.property('params');
      });
  });
});

describe('GET /api/v1/device/:device_selector', () => {
  it('should get device by selector', async () => {
    await authenticatedRequest
      .get('/api/v1/device/test-device')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('selector', 'test-device');
        expect(res.body).to.have.property('features');
        expect(res.body).to.have.property('params');
      });
  });
});

describe('DELETE /api/v1/device/:device_selector', () => {
  it('should delete device', async () => {
    await authenticatedRequest
      .delete('/api/v1/device/test-device')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('success', true);
      });
  });
});

describe('GET /api/v1/device', () => {
  it('should get device', async () => {
    await authenticatedRequest
      .get('/api/v1/device')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.instanceOf(Array);
        res.body.forEach((device) => {
          expect(device).to.have.property('features');
          expect(device).to.have.property('params');
        });
      });
  });
});

describe('GET /api/v1/service/:service_name/device', () => {
  it('should return devices in service test-service', async () => {
    await authenticatedRequest
      .get('/api/v1/service/test-service/device')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.instanceOf(Array);
      });
  });
  it('should return 404 not found', async () => {
    await authenticatedRequest
      .get('/api/v1/service/unknown-service/device')
      .expect('Content-Type', /json/)
      .expect(404);
  });
});

describe.only('GET /api/v1/device_feature_sate', () => {
  it('should get device_feature_sate', async () => {
  /*
    const myDate = new Date();
    let myData = '';
    for (let i = 0 ; i < 10000 ; i+=1){
      myDate.setSeconds(myDate.getSeconds() + (i*10));
      myData+=`
      {
        id: '${uuid.v4()}',
        device_feature_id: 'bb1af3b9-f87d-4d9c-b5be-958cd9d28900',
        value: ${Math.floor(Math.random() * 50) + 1},
        created_at: '${myDate.toISOString()}',
        updated_at: '${myDate.toISOString()}',
      },`;

    } 
    await fs.writeFile('testSM.txt', myData, function (err) {
      if (err) {
         return console.log(err); 
        };
      console.log('Hello World > helloworld.txt');
      return null;
    });
    */

    await authenticatedRequest
      .get('/api/v1/device_feature_sate/test-device/test-temperature-sensor')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.instanceOf(Array);
        res.body.forEach((device) => {
          expect(device).to.have.property('features');
          device.features.forEach((feature) => {
            expect(feature).to.have.property('device_feature_states');
          });
        });

        expect(res.body).to.be.instanceOf(Array)
          .and.have.lengthOf(1);
        expect(res.body[0].features).to.be.instanceOf(Array)
          .and.have.lengthOf(1);
        expect(res.body[0].features[0].device_feature_states).to.be.instanceOf(Array)
          .and.have.lengthOf(100);
        
      });

  });
});
