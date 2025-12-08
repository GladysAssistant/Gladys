const { expect } = require('chai');
const nock = require('nock');
const { getContracts } = require('../../../../services/energy-monitoring/lib/energy-monitoring.getContracts');

describe('EnergyMonitoring.getContracts', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should successfully fetch contracts from GitHub releases', async () => {
    const mockRelease = {
      tag_name: 'v1.0.0',
      assets: [
        {
          name: 'contracts.json',
          browser_download_url:
            'https://github.com/GladysAssistant/energy-contracts/releases/download/v1.0.0/contracts.json',
        },
        {
          name: 'other-file.txt',
          browser_download_url:
            'https://github.com/GladysAssistant/energy-contracts/releases/download/v1.0.0/other-file.txt',
        },
      ],
    };

    const mockContracts = {
      'edf-base': {
        '3': [
          {
            contract: 'base',
            price_type: 'consumption',
            currency: 'euro',
            start_date: '2023-01-01',
            end_date: '2023-12-31',
            price: 1500,
            hour_slots: null,
            day_type: null,
          },
        ],
        '6': [
          {
            contract: 'base',
            price_type: 'consumption',
            currency: 'euro',
            start_date: '2023-01-01',
            end_date: '2023-12-31',
            price: 1450,
            hour_slots: null,
            day_type: null,
          },
        ],
      },
      'edf-tempo': {
        '6': [
          {
            contract: 'edf_tempo',
            price_type: 'consumption',
            currency: 'euro',
            start_date: '2023-01-01',
            end_date: '2023-12-31',
            price: 1200,
            hour_slots:
              '00:00,00:30,01:00,01:30,02:00,02:30,03:00,03:30,04:00,04:30,05:00,05:30,22:00,22:30,23:00,23:30',
            day_type: 'blue',
          },
          {
            contract: 'edf_tempo',
            price_type: 'consumption',
            currency: 'euro',
            start_date: '2023-01-01',
            end_date: '2023-12-31',
            price: 1600,
            hour_slots:
              '06:00,06:30,07:00,07:30,08:00,08:30,09:00,09:30,10:00,10:30,11:00,11:30,12:00,12:30,13:00,13:30,14:00,14:30,15:00,15:30,16:00,16:30,17:00,17:30,18:00,18:30,19:00,19:30,20:00,20:30,21:00,21:30',
            day_type: 'blue',
          },
        ],
      },
    };

    // Mock the GitHub API call to get latest release
    nock('https://api.github.com')
      .get('/repos/GladysAssistant/energy-contracts/releases/latest')
      .reply(200, mockRelease);

    // Mock the download of contracts.json
    nock('https://github.com')
      .get('/GladysAssistant/energy-contracts/releases/download/v1.0.0/contracts.json')
      .reply(200, mockContracts);

    const result = await getContracts();

    expect(result).to.deep.equal(mockContracts);
    expect(result).to.have.property('edf-base');
    expect(result).to.have.property('edf-tempo');
    expect(result['edf-base']).to.have.property('3');
    expect(result['edf-base']).to.have.property('6');
    expect(result['edf-tempo']).to.have.property('6');
  });

  it('should throw error when GitHub API call fails', async () => {
    // Mock failed GitHub API call
    nock('https://api.github.com')
      .get('/repos/GladysAssistant/energy-contracts/releases/latest')
      .reply(500, { message: 'Internal Server Error' });

    try {
      await getContracts();
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('Request failed with status code 500');
    }
  });

  it('should throw error when contracts.json asset is not found', async () => {
    const mockReleaseWithoutContracts = {
      tag_name: 'v1.0.0',
      assets: [
        {
          name: 'other-file.txt',
          browser_download_url:
            'https://github.com/GladysAssistant/energy-contracts/releases/download/v1.0.0/other-file.txt',
        },
      ],
    };

    // Mock the GitHub API call to get latest release
    nock('https://api.github.com')
      .get('/repos/GladysAssistant/energy-contracts/releases/latest')
      .reply(200, mockReleaseWithoutContracts);

    try {
      await getContracts();
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.equal('contracts.json not found in the latest release');
    }
  });

  it('should throw error when contracts.json download fails', async () => {
    const mockRelease = {
      tag_name: 'v1.0.0',
      assets: [
        {
          name: 'contracts.json',
          browser_download_url:
            'https://github.com/GladysAssistant/energy-contracts/releases/download/v1.0.0/contracts.json',
        },
      ],
    };

    // Mock the GitHub API call to get latest release
    nock('https://api.github.com')
      .get('/repos/GladysAssistant/energy-contracts/releases/latest')
      .reply(200, mockRelease);

    // Mock failed download of contracts.json
    nock('https://github.com')
      .get('/GladysAssistant/energy-contracts/releases/download/v1.0.0/contracts.json')
      .reply(404, { message: 'Not Found' });

    try {
      await getContracts();
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('Request failed with status code 404');
    }
  });

  it('should handle empty contracts response', async () => {
    const mockRelease = {
      tag_name: 'v1.0.0',
      assets: [
        {
          name: 'contracts.json',
          browser_download_url:
            'https://github.com/GladysAssistant/energy-contracts/releases/download/v1.0.0/contracts.json',
        },
      ],
    };

    const emptyContracts = {};

    // Mock the GitHub API call to get latest release
    nock('https://api.github.com')
      .get('/repos/GladysAssistant/energy-contracts/releases/latest')
      .reply(200, mockRelease);

    // Mock the download of empty contracts.json
    nock('https://github.com')
      .get('/GladysAssistant/energy-contracts/releases/download/v1.0.0/contracts.json')
      .reply(200, emptyContracts);

    const result = await getContracts();

    expect(result).to.deep.equal(emptyContracts);
    expect(Object.keys(result)).to.have.lengthOf(0);
  });

  it('should handle malformed JSON response', async () => {
    const mockRelease = {
      tag_name: 'v1.0.0',
      assets: [
        {
          name: 'contracts.json',
          browser_download_url:
            'https://github.com/GladysAssistant/energy-contracts/releases/download/v1.0.0/contracts.json',
        },
      ],
    };

    // Mock the GitHub API call to get latest release
    nock('https://api.github.com')
      .get('/repos/GladysAssistant/energy-contracts/releases/latest')
      .reply(200, mockRelease);

    // Mock the download of malformed contracts.json - return invalid JSON
    nock('https://github.com')
      .get('/GladysAssistant/energy-contracts/releases/download/v1.0.0/contracts.json')
      .reply(200, 'invalid json content', {
        'content-type': 'text/plain',
      });

    try {
      await getContracts();
      expect.fail('Should have thrown an error');
    } catch (error) {
      // The error could be a JSON parsing error, request error, or validation error
      expect(error.message).to.equal('contracts.json must be a valid JSON object');
    }
  });

  it('should handle network timeout', async () => {
    // Mock network timeout
    nock('https://api.github.com')
      .get('/repos/GladysAssistant/energy-contracts/releases/latest')
      .replyWithError({ code: 'ECONNABORTED', message: 'timeout of 5000ms exceeded' });

    try {
      await getContracts();
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('timeout of 5000ms exceeded');
    }
  });
});
