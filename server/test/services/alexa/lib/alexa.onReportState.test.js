const sinon = require('sinon');
const { expect } = require('chai');
const get = require('get-value');

const { fake } = sinon;
const AlexaHandler = require('../../../../services/alexa/lib');

const serviceId = 'd1e45425-fe25-4968-ac0f-bc695d5202d9';

describe('alexa.onReportState', () => {
  it('Should return current state of power feature', async () => {
    const gladys = {
      stateManager: {
        get: fake.returns({
          name: 'Device 1',
          selector: 'device-1',
          external_id: 'device-1-external-id',
          features: [
            {
              read_only: false,
              category: 'light',
              type: 'binary',
              last_value: 1,
            },
          ],
          model: 'device-model',
          room: {
            name: 'living-room',
          },
        }),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa',
          name: 'ReportState',
          payloadVersion: '3',
          messageId: 'a05c8249-1cdd-41dd-bc1d-5a14ab4b98eb',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JAAIAAAAAAADgCDHXLLn3nx8SmjtElD2w8CfsniSH6KxFhbRSgD/sELuMpZTr4Jl/E3Nip62gpI2QqFNm/TrQ/Pi+XSFtf/4AVCDxe4bV2FAXSVu61AsuUlhbdqdvjUoaHOuqSLW8F3Qj9z3HWhfvTCMEbbhw4XVDWOsyXb9nknvswimA+R4ftNdBx5POWZGxWtbvU+yeBStTV+QwSSZaHWjzQdi/LAo1KW35MkmLikny7Y7J097LTTL1Tof6IkLsi9/gxOtUUFvnD4yIkWeHTT110Ch6R4kDuonNtOiHsTmMMRtsY5kRWoIL9VMfX6QHWjamhvd+XJp4sXkLMBdtJ3aTzfsUNrQIdrcPTox9qTNjShunTlbAYkq1TSUXaylEGHvcwHrbo7ZoUlBvidqnJGUNRJPxOHHyfCm5VqFzuFI8AG1W/dj1W4Di0AAND/mwzjZKUTRsiX4uEaRw8/Na4Qj/GBMuT18hUoGpe7t/UYw5JFw+MXm0kn/5jKe9r62xil3TN8BK9ODQDP9zq08+iiT0CBtEX5F4Drrowb57IwcW7nt/hkCeeyR59B/Z6nPsSq0NQ+rd1w4a1iHIyaTU6acQsKwmaX1OeTvtT2p7U/HhqfhVMSqA7ybGhQDF4FPPzIbh+o+D1S+AX9m9nVSSJNwoevikdZimCbk1l1HmUrhz78GO+j0yFg==',
        },
        endpoint: { endpointId: 'device-1' },
        payload: {},
      },
      user: { id: 'cbd42dc1-1b15-4c59-bea6-7e01968a9603', local_user_id: '275faa00-8a9c-4747-8fbe-417ddb966b16' },
    };
    const result = alexaHandler.onReportState(body);
    expect(result).to.deep.equal({
      event: {
        header: {
          namespace: 'Alexa',
          name: 'StateReport',
          payloadVersion: '3',
          messageId: get(result, 'event.header.messageId'),
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JAAIAAAAAAADgCDHXLLn3nx8SmjtElD2w8CfsniSH6KxFhbRSgD/sELuMpZTr4Jl/E3Nip62gpI2QqFNm/TrQ/Pi+XSFtf/4AVCDxe4bV2FAXSVu61AsuUlhbdqdvjUoaHOuqSLW8F3Qj9z3HWhfvTCMEbbhw4XVDWOsyXb9nknvswimA+R4ftNdBx5POWZGxWtbvU+yeBStTV+QwSSZaHWjzQdi/LAo1KW35MkmLikny7Y7J097LTTL1Tof6IkLsi9/gxOtUUFvnD4yIkWeHTT110Ch6R4kDuonNtOiHsTmMMRtsY5kRWoIL9VMfX6QHWjamhvd+XJp4sXkLMBdtJ3aTzfsUNrQIdrcPTox9qTNjShunTlbAYkq1TSUXaylEGHvcwHrbo7ZoUlBvidqnJGUNRJPxOHHyfCm5VqFzuFI8AG1W/dj1W4Di0AAND/mwzjZKUTRsiX4uEaRw8/Na4Qj/GBMuT18hUoGpe7t/UYw5JFw+MXm0kn/5jKe9r62xil3TN8BK9ODQDP9zq08+iiT0CBtEX5F4Drrowb57IwcW7nt/hkCeeyR59B/Z6nPsSq0NQ+rd1w4a1iHIyaTU6acQsKwmaX1OeTvtT2p7U/HhqfhVMSqA7ybGhQDF4FPPzIbh+o+D1S+AX9m9nVSSJNwoevikdZimCbk1l1HmUrhz78GO+j0yFg==',
        },
        endpoint: { endpointId: 'device-1' },
        payload: {},
      },
      context: {
        properties: [
          {
            namespace: 'Alexa.PowerController',
            name: 'powerState',
            value: 'ON',
            timeOfSample: get(result, 'context.properties.0.timeOfSample'),
            uncertaintyInMilliseconds: 0,
          },
        ],
      },
    });
  });
  it('Should return current state of brightness feature', async () => {
    const gladys = {
      stateManager: {
        get: fake.returns({
          name: 'Device 1',
          selector: 'device-1',
          external_id: 'device-1-external-id',
          features: [
            {
              read_only: false,
              category: 'light',
              type: 'brightness',
              min: 0,
              max: 100,
              last_value: 50,
            },
          ],
          model: 'device-model',
          room: {
            name: 'living-room',
          },
        }),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa',
          name: 'ReportState',
          payloadVersion: '3',
          messageId: 'a05c8249-1cdd-41dd-bc1d-5a14ab4b98eb',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JAAIAAAAAAADgCDHXLLn3nx8SmjtElD2w8CfsniSH6KxFhbRSgD/sELuMpZTr4Jl/E3Nip62gpI2QqFNm/TrQ/Pi+XSFtf/4AVCDxe4bV2FAXSVu61AsuUlhbdqdvjUoaHOuqSLW8F3Qj9z3HWhfvTCMEbbhw4XVDWOsyXb9nknvswimA+R4ftNdBx5POWZGxWtbvU+yeBStTV+QwSSZaHWjzQdi/LAo1KW35MkmLikny7Y7J097LTTL1Tof6IkLsi9/gxOtUUFvnD4yIkWeHTT110Ch6R4kDuonNtOiHsTmMMRtsY5kRWoIL9VMfX6QHWjamhvd+XJp4sXkLMBdtJ3aTzfsUNrQIdrcPTox9qTNjShunTlbAYkq1TSUXaylEGHvcwHrbo7ZoUlBvidqnJGUNRJPxOHHyfCm5VqFzuFI8AG1W/dj1W4Di0AAND/mwzjZKUTRsiX4uEaRw8/Na4Qj/GBMuT18hUoGpe7t/UYw5JFw+MXm0kn/5jKe9r62xil3TN8BK9ODQDP9zq08+iiT0CBtEX5F4Drrowb57IwcW7nt/hkCeeyR59B/Z6nPsSq0NQ+rd1w4a1iHIyaTU6acQsKwmaX1OeTvtT2p7U/HhqfhVMSqA7ybGhQDF4FPPzIbh+o+D1S+AX9m9nVSSJNwoevikdZimCbk1l1HmUrhz78GO+j0yFg==',
        },
        endpoint: { endpointId: 'device-1' },
        payload: {},
      },
      user: { id: 'cbd42dc1-1b15-4c59-bea6-7e01968a9603', local_user_id: '275faa00-8a9c-4747-8fbe-417ddb966b16' },
    };
    const result = alexaHandler.onReportState(body);
    expect(result).to.deep.equal({
      event: {
        header: {
          namespace: 'Alexa',
          name: 'StateReport',
          payloadVersion: '3',
          messageId: get(result, 'event.header.messageId'),
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JAAIAAAAAAADgCDHXLLn3nx8SmjtElD2w8CfsniSH6KxFhbRSgD/sELuMpZTr4Jl/E3Nip62gpI2QqFNm/TrQ/Pi+XSFtf/4AVCDxe4bV2FAXSVu61AsuUlhbdqdvjUoaHOuqSLW8F3Qj9z3HWhfvTCMEbbhw4XVDWOsyXb9nknvswimA+R4ftNdBx5POWZGxWtbvU+yeBStTV+QwSSZaHWjzQdi/LAo1KW35MkmLikny7Y7J097LTTL1Tof6IkLsi9/gxOtUUFvnD4yIkWeHTT110Ch6R4kDuonNtOiHsTmMMRtsY5kRWoIL9VMfX6QHWjamhvd+XJp4sXkLMBdtJ3aTzfsUNrQIdrcPTox9qTNjShunTlbAYkq1TSUXaylEGHvcwHrbo7ZoUlBvidqnJGUNRJPxOHHyfCm5VqFzuFI8AG1W/dj1W4Di0AAND/mwzjZKUTRsiX4uEaRw8/Na4Qj/GBMuT18hUoGpe7t/UYw5JFw+MXm0kn/5jKe9r62xil3TN8BK9ODQDP9zq08+iiT0CBtEX5F4Drrowb57IwcW7nt/hkCeeyR59B/Z6nPsSq0NQ+rd1w4a1iHIyaTU6acQsKwmaX1OeTvtT2p7U/HhqfhVMSqA7ybGhQDF4FPPzIbh+o+D1S+AX9m9nVSSJNwoevikdZimCbk1l1HmUrhz78GO+j0yFg==',
        },
        endpoint: { endpointId: 'device-1' },
        payload: {},
      },
      context: {
        properties: [
          {
            namespace: 'Alexa.BrightnessController',
            name: 'brightness',
            value: 50,
            timeOfSample: get(result, 'context.properties.0.timeOfSample'),
            uncertaintyInMilliseconds: 0,
          },
        ],
      },
    });
  });
  it('Should return current state of color feature', async () => {
    const gladys = {
      stateManager: {
        get: fake.returns({
          name: 'Device 1',
          selector: 'device-1',
          external_id: 'device-1-external-id',
          features: [
            {
              read_only: false,
              category: 'light',
              type: 'color',
              last_value: 16711935,
            },
          ],
          model: 'device-model',
          room: {
            name: 'living-room',
          },
        }),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa',
          name: 'ReportState',
          payloadVersion: '3',
          messageId: 'a05c8249-1cdd-41dd-bc1d-5a14ab4b98eb',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JAAIAAAAAAADgCDHXLLn3nx8SmjtElD2w8CfsniSH6KxFhbRSgD/sELuMpZTr4Jl/E3Nip62gpI2QqFNm/TrQ/Pi+XSFtf/4AVCDxe4bV2FAXSVu61AsuUlhbdqdvjUoaHOuqSLW8F3Qj9z3HWhfvTCMEbbhw4XVDWOsyXb9nknvswimA+R4ftNdBx5POWZGxWtbvU+yeBStTV+QwSSZaHWjzQdi/LAo1KW35MkmLikny7Y7J097LTTL1Tof6IkLsi9/gxOtUUFvnD4yIkWeHTT110Ch6R4kDuonNtOiHsTmMMRtsY5kRWoIL9VMfX6QHWjamhvd+XJp4sXkLMBdtJ3aTzfsUNrQIdrcPTox9qTNjShunTlbAYkq1TSUXaylEGHvcwHrbo7ZoUlBvidqnJGUNRJPxOHHyfCm5VqFzuFI8AG1W/dj1W4Di0AAND/mwzjZKUTRsiX4uEaRw8/Na4Qj/GBMuT18hUoGpe7t/UYw5JFw+MXm0kn/5jKe9r62xil3TN8BK9ODQDP9zq08+iiT0CBtEX5F4Drrowb57IwcW7nt/hkCeeyR59B/Z6nPsSq0NQ+rd1w4a1iHIyaTU6acQsKwmaX1OeTvtT2p7U/HhqfhVMSqA7ybGhQDF4FPPzIbh+o+D1S+AX9m9nVSSJNwoevikdZimCbk1l1HmUrhz78GO+j0yFg==',
        },
        endpoint: { endpointId: 'device-1' },
        payload: {},
      },
      user: { id: 'cbd42dc1-1b15-4c59-bea6-7e01968a9603', local_user_id: '275faa00-8a9c-4747-8fbe-417ddb966b16' },
    };
    const result = alexaHandler.onReportState(body);
    expect(result).to.deep.equal({
      event: {
        header: {
          namespace: 'Alexa',
          name: 'StateReport',
          payloadVersion: '3',
          messageId: get(result, 'event.header.messageId'),
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JAAIAAAAAAADgCDHXLLn3nx8SmjtElD2w8CfsniSH6KxFhbRSgD/sELuMpZTr4Jl/E3Nip62gpI2QqFNm/TrQ/Pi+XSFtf/4AVCDxe4bV2FAXSVu61AsuUlhbdqdvjUoaHOuqSLW8F3Qj9z3HWhfvTCMEbbhw4XVDWOsyXb9nknvswimA+R4ftNdBx5POWZGxWtbvU+yeBStTV+QwSSZaHWjzQdi/LAo1KW35MkmLikny7Y7J097LTTL1Tof6IkLsi9/gxOtUUFvnD4yIkWeHTT110Ch6R4kDuonNtOiHsTmMMRtsY5kRWoIL9VMfX6QHWjamhvd+XJp4sXkLMBdtJ3aTzfsUNrQIdrcPTox9qTNjShunTlbAYkq1TSUXaylEGHvcwHrbo7ZoUlBvidqnJGUNRJPxOHHyfCm5VqFzuFI8AG1W/dj1W4Di0AAND/mwzjZKUTRsiX4uEaRw8/Na4Qj/GBMuT18hUoGpe7t/UYw5JFw+MXm0kn/5jKe9r62xil3TN8BK9ODQDP9zq08+iiT0CBtEX5F4Drrowb57IwcW7nt/hkCeeyR59B/Z6nPsSq0NQ+rd1w4a1iHIyaTU6acQsKwmaX1OeTvtT2p7U/HhqfhVMSqA7ybGhQDF4FPPzIbh+o+D1S+AX9m9nVSSJNwoevikdZimCbk1l1HmUrhz78GO+j0yFg==',
        },
        endpoint: { endpointId: 'device-1' },
        payload: {},
      },
      context: {
        properties: [
          {
            namespace: 'Alexa.ColorController',
            name: 'color',
            value: {
              hue: 300,
              saturation: 1,
              brightness: 1,
            },
            timeOfSample: get(result, 'context.properties.0.timeOfSample'),
            uncertaintyInMilliseconds: 0,
          },
        ],
      },
    });
  });
  it('Should return device not found', async () => {
    const gladys = {
      stateManager: {
        get: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa',
          name: 'ReportState',
          payloadVersion: '3',
          messageId: 'a05c8249-1cdd-41dd-bc1d-5a14ab4b98eb',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JAAIAAAAAAADgCDHXLLn3nx8SmjtElD2w8CfsniSH6KxFhbRSgD/sELuMpZTr4Jl/E3Nip62gpI2QqFNm/TrQ/Pi+XSFtf/4AVCDxe4bV2FAXSVu61AsuUlhbdqdvjUoaHOuqSLW8F3Qj9z3HWhfvTCMEbbhw4XVDWOsyXb9nknvswimA+R4ftNdBx5POWZGxWtbvU+yeBStTV+QwSSZaHWjzQdi/LAo1KW35MkmLikny7Y7J097LTTL1Tof6IkLsi9/gxOtUUFvnD4yIkWeHTT110Ch6R4kDuonNtOiHsTmMMRtsY5kRWoIL9VMfX6QHWjamhvd+XJp4sXkLMBdtJ3aTzfsUNrQIdrcPTox9qTNjShunTlbAYkq1TSUXaylEGHvcwHrbo7ZoUlBvidqnJGUNRJPxOHHyfCm5VqFzuFI8AG1W/dj1W4Di0AAND/mwzjZKUTRsiX4uEaRw8/Na4Qj/GBMuT18hUoGpe7t/UYw5JFw+MXm0kn/5jKe9r62xil3TN8BK9ODQDP9zq08+iiT0CBtEX5F4Drrowb57IwcW7nt/hkCeeyR59B/Z6nPsSq0NQ+rd1w4a1iHIyaTU6acQsKwmaX1OeTvtT2p7U/HhqfhVMSqA7ybGhQDF4FPPzIbh+o+D1S+AX9m9nVSSJNwoevikdZimCbk1l1HmUrhz78GO+j0yFg==',
        },
        endpoint: { endpointId: 'device-1' },
        payload: {},
      },
      user: { id: 'cbd42dc1-1b15-4c59-bea6-7e01968a9603', local_user_id: '275faa00-8a9c-4747-8fbe-417ddb966b16' },
    };
    expect(() => {
      alexaHandler.onReportState(body);
    }).to.throw('Device "device-1" not found');
  });
});
