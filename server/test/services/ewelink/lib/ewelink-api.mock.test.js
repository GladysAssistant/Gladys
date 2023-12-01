const Promise = require('bluebird');
const EweLink2ChDevice = require('./payloads/eweLink-2ch.json');
const EweLinkBasicDevice = require('./payloads/eweLink-basic.json');
const EweLinkOfflineDevice = require('./payloads/eweLink-offline.json');
const EweLinkPowDevice = require('./payloads/eweLink-pow.json');
const EweLinkThDevice = require('./payloads/eweLink-th.json');
const EweLinkUnhandledDevice = require('./payloads/eweLink-unhandled.json');
const {
  EWELINK_APP_ID,
  EWELINK_APP_SECRET,
  EWELINK_APP_REGION,
  EWELINK_VALID_ACCESS_TOKEN,
  EWELINK_INVALID_ACCESS_TOKEN,
} = require('./constants');

const fakeDevices = [EweLink2ChDevice, EweLinkOfflineDevice, EweLinkPowDevice, EweLinkThDevice, EweLinkUnhandledDevice];

const buildResponse = async (data, accessToken) => {
  const response = {
    status: 200,
    error: 0,
    data,
  };

  if (accessToken === EWELINK_INVALID_ACCESS_TOKEN) {
    response.error = 401;
    response.msg = 'eWeLink: Error, service is not configured';
  } else if (accessToken !== EWELINK_VALID_ACCESS_TOKEN) {
    response.error = 406;
    response.msg = 'eWeLink: Authentication error';
  }

  return Promise.resolve(response);
};

class Device {
  constructor(root) {
    this.root = root;
  }

  async getAllThingsAllPages() {
    const data = {
      thingList: fakeDevices.map((device) => {
        return { itemData: device };
      }),
    };

    return buildResponse(data, this.root.at);
  }

  async getThings({ thingList }) {
    const [firstItem] = thingList;
    const { id: deviceId } = firstItem;

    const device = [...fakeDevices, EweLinkBasicDevice].find((fakeDevice) => fakeDevice.deviceid === deviceId);
    const response = await buildResponse({ thingList: [{ itemData: device }] }, this.root.at);

    if (!response.error) {
      if (!device) {
        response.error = 405;
        response.msg = 'Device does not exist';
      } else if (!device.online) {
        response.error = 4002;
        response.msg = 'eWeLink: Error, device is not currently online';
      }
    }

    return response;
  }

  async setThingStatus(type, id, params) {
    const deviceResponse = await this.getThings({ thingList: [{ id }] });
    return { ...deviceResponse, data: {} };
  }
}

class WebAPI {
  constructor(options = { appId: EWELINK_APP_ID, appSecret: EWELINK_APP_SECRET, region: EWELINK_APP_REGION }) {
    this.appId = options.appId;
    this.appSecret = options.appSecret;
    this.region = options.region;

    // default with right access token
    this.at = EWELINK_VALID_ACCESS_TOKEN;

    this.device = new Device(this);
  }
}

const items = { WebAPI, Device };

module.exports = { default: items, ...items };
