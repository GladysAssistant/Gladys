const { fake, assert } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const EventEmitter = require('events');

const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');

const event = new EventEmitter();

const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

const getConfig = require('../../../utils/getConfig');

const sequelize = {
  close: fake.resolves(null),
};

const system = {
  getInfos: fake.resolves({
    nodejs_version: 'v10.15.2',
    gladys_version: 'v4.0.0',
    is_docker: false,
  }),
  isDocker: fake.resolves(true),
  saveLatestGladysVersion: fake.returns(null),
  shutdown: fake.resolves(true),
};

const config = getConfig();

const job = {
  wrapper: (type, func) => {
    return async () => {
      return func();
    };
  },
  updateProgress: fake.resolves({}),
};

describe('gateway.handleAlexaMessage', () => {
  const variable = {
    getValue: fake.resolves(null),
    setValue: fake.resolves(null),
  };
  const alexaService = {
    alexaHandler: {
      onDiscovery: fake.returns({ onDiscovery: true }),
      onReportState: fake.returns({ onReportState: true }),
      onExecute: fake.returns({ onExecute: true }),
    },
  };
  it('should handle PowerController message', async () => {
    const serviceManager = {
      getService: fake.returns(alexaService),
    };
    const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, serviceManager, job);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.PowerController',
          name: 'TurnOn',
          payloadVersion: '3',
          messageId: 'c43c5ef1-b456-4736-ba6b-4643a98a7e27',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {},
      },
    };
    const callback = fake.returns(null);
    await gateway.handleAlexaMessage({ data: body }, '', callback);
    assert.calledWith(callback, { onExecute: true });
  });
  it('should handle BrightnessController message', async () => {
    const serviceManager = {
      getService: fake.returns(alexaService),
    };
    const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, serviceManager, job);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.BrightnessController',
          name: 'SetBrightness',
          payloadVersion: '3',
          messageId: 'c43c5ef1-b456-4736-ba6b-4643a98a7e27',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: { brightness: 50 },
      },
      user: { id: 'cbd42dc1-1b15-4c59-bea6-7e01968a9603', local_user_id: '275faa00-8a9c-4747-8fbe-417ddb966b16' },
    };
    const callback = fake.returns(null);
    await gateway.handleAlexaMessage({ data: body }, '', callback);
    assert.calledWith(callback, { onExecute: true });
  });
  it('should handle ColorController message', async () => {
    const serviceManager = {
      getService: fake.returns(alexaService),
    };
    const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, serviceManager, job);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.ColorController',
          name: 'SetColor',
          payloadVersion: '3',
          messageId: 'c43c5ef1-b456-4736-ba6b-4643a98a7e27',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {
          color: {
            hue: 300,
            saturation: 1,
            brightness: 1,
          },
        },
      },
      user: { id: 'cbd42dc1-1b15-4c59-bea6-7e01968a9603', local_user_id: '275faa00-8a9c-4747-8fbe-417ddb966b16' },
    };
    const callback = fake.returns(null);
    await gateway.handleAlexaMessage({ data: body }, '', callback);
    assert.calledWith(callback, { onExecute: true });
  });
  it('should handle Discovery message', async () => {
    const serviceManager = {
      getService: fake.returns(alexaService),
    };
    const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, serviceManager, job);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.Discovery',
          name: 'Discover',
          messageId: 'message id',
          payloadVersion: '3',
        },
        payload: {},
      },
    };
    const callback = fake.returns(null);
    await gateway.handleAlexaMessage({ data: body }, '', callback);
    assert.calledWith(callback, { onDiscovery: true });
  });
  it('should handle Report state message', async () => {
    const serviceManager = {
      getService: fake.returns(alexaService),
    };
    const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, serviceManager, job);
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
    };
    const callback = fake.returns(null);
    await gateway.handleAlexaMessage({ data: body }, '', callback);
    assert.calledWith(callback, { onReportState: true });
  });
  it('should return 400 unknown', async () => {
    const serviceManager = {
      getService: fake.returns(alexaService),
    };
    const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, serviceManager, job);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa',
          name: 'UNKNOWN',
          payloadVersion: '3',
          messageId: 'a05c8249-1cdd-41dd-bc1d-5a14ab4b98eb',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JAAIAAAAAAADgCDHXLLn3nx8SmjtElD2w8CfsniSH6KxFhbRSgD/sELuMpZTr4Jl/E3Nip62gpI2QqFNm/TrQ/Pi+XSFtf/4AVCDxe4bV2FAXSVu61AsuUlhbdqdvjUoaHOuqSLW8F3Qj9z3HWhfvTCMEbbhw4XVDWOsyXb9nknvswimA+R4ftNdBx5POWZGxWtbvU+yeBStTV+QwSSZaHWjzQdi/LAo1KW35MkmLikny7Y7J097LTTL1Tof6IkLsi9/gxOtUUFvnD4yIkWeHTT110Ch6R4kDuonNtOiHsTmMMRtsY5kRWoIL9VMfX6QHWjamhvd+XJp4sXkLMBdtJ3aTzfsUNrQIdrcPTox9qTNjShunTlbAYkq1TSUXaylEGHvcwHrbo7ZoUlBvidqnJGUNRJPxOHHyfCm5VqFzuFI8AG1W/dj1W4Di0AAND/mwzjZKUTRsiX4uEaRw8/Na4Qj/GBMuT18hUoGpe7t/UYw5JFw+MXm0kn/5jKe9r62xil3TN8BK9ODQDP9zq08+iiT0CBtEX5F4Drrowb57IwcW7nt/hkCeeyR59B/Z6nPsSq0NQ+rd1w4a1iHIyaTU6acQsKwmaX1OeTvtT2p7U/HhqfhVMSqA7ybGhQDF4FPPzIbh+o+D1S+AX9m9nVSSJNwoevikdZimCbk1l1HmUrhz78GO+j0yFg==',
        },
        endpoint: { endpointId: 'device-1' },
        payload: {},
      },
    };
    const callback = fake.returns(null);
    await gateway.handleAlexaMessage({ data: body }, '', callback);
    assert.calledWith(callback, { status: 400 });
  });
  it('should return 400 error', async () => {
    const serviceManager = {
      getService: fake.throws('ERROR'),
    };
    const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, serviceManager, job);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa',
          name: 'UNKNOWN',
          payloadVersion: '3',
          messageId: 'a05c8249-1cdd-41dd-bc1d-5a14ab4b98eb',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JAAIAAAAAAADgCDHXLLn3nx8SmjtElD2w8CfsniSH6KxFhbRSgD/sELuMpZTr4Jl/E3Nip62gpI2QqFNm/TrQ/Pi+XSFtf/4AVCDxe4bV2FAXSVu61AsuUlhbdqdvjUoaHOuqSLW8F3Qj9z3HWhfvTCMEbbhw4XVDWOsyXb9nknvswimA+R4ftNdBx5POWZGxWtbvU+yeBStTV+QwSSZaHWjzQdi/LAo1KW35MkmLikny7Y7J097LTTL1Tof6IkLsi9/gxOtUUFvnD4yIkWeHTT110Ch6R4kDuonNtOiHsTmMMRtsY5kRWoIL9VMfX6QHWjamhvd+XJp4sXkLMBdtJ3aTzfsUNrQIdrcPTox9qTNjShunTlbAYkq1TSUXaylEGHvcwHrbo7ZoUlBvidqnJGUNRJPxOHHyfCm5VqFzuFI8AG1W/dj1W4Di0AAND/mwzjZKUTRsiX4uEaRw8/Na4Qj/GBMuT18hUoGpe7t/UYw5JFw+MXm0kn/5jKe9r62xil3TN8BK9ODQDP9zq08+iiT0CBtEX5F4Drrowb57IwcW7nt/hkCeeyR59B/Z6nPsSq0NQ+rd1w4a1iHIyaTU6acQsKwmaX1OeTvtT2p7U/HhqfhVMSqA7ybGhQDF4FPPzIbh+o+D1S+AX9m9nVSSJNwoevikdZimCbk1l1HmUrhz78GO+j0yFg==',
        },
        endpoint: { endpointId: 'device-1' },
        payload: {},
      },
    };
    const callback = fake.returns(null);
    await gateway.handleAlexaMessage({ data: body }, '', callback);
    assert.calledWith(callback, { status: 400 });
  });
});
