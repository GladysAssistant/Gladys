const { expect } = require('chai');

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const gladys = {
  job: {
    wrapper: (type, func) => {
      return async () => {
        return func();
      };
    },
  },
};
const mqttLibrary = {};
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt getManagedAdapters', () => {
  let manager;

  beforeEach(() => {
    manager = new Zigbee2mqttManager(gladys, mqttLibrary, serviceId);
  });

  it('should get adapters', () => {
    const adapters = manager.getManagedAdapters();
    expect(adapters).deep.eq([
      "CircuitSetup's CC2652P2 USB Coordinator",
      'cod.m Zigbee CC2652P RPi Module',
      'cod.m ZigBee CC2652P2 TCP Coordinator',
      'ConBee',
      'ConBee II',
      'CoolKit ZB-GW04 USB dongle (a.k.a. easyiot stick)',
      'cyijun OpenZ3Gateway',
      'Egony Stick V4',
      'Electrolama zig-a-zig-ah! (zzh!)',
      'Elelabs ELU013 and Popp ZB-STICK',
      'Elelabs Zigbee Raspberry Pi Shield/Popp ZB-Shield',
      'Gio-dot Z-Bee Duo with CC2652P',
      'Home Assistant SkyConnect (by Nabu Casa)',
      'ITead Sonoff Zigbee 3.0 USB Dongle Plus V2 model "ZBDongle-E"',
      'RaspBee',
      'RaspBee II',
      "Slaesh's CC2652RB stick",
      'SMLIGHT CC2652P Zigbee USB Adapter SLZB-02',
      'SMLIGHT SLZB-06 Zigbee ethernet USB POE WiFi LAN adapter',
      'SMLIGHT Zigbee LAN Adapter CC2652P Model SLZB-05',
      'SONOFF Zigbee 3.0 USB Dongle Plus ZBDongle-P',
      'Texas Instruments CC2530',
      'Texas Instruments CC2531',
      'Texas Instruments CC2538',
      'Texas Instruments CC2538 HAT',
      'Texas Instruments LAUNCHXL-CC1352P-2',
      'Texas Instruments LAUNCHXL-CC26X2R1',
      "Tube's CC2652P2 USB Coordinator",
      "Tube's Zigbee Gateways (CC2652P2 variant)",
      'TubesZB Zigbee EFR32 pro ethernet/USB serial coordinator',
      'Vision CC2538+CC2592 Dongle(VS203)',
      'Vision CC2652 dongle',
      'XGG 52PZ2MGateway',
      'XGG Gateway',
      'ZigStar LAN Coordinator',
      'ZigStar PoE Coordinator',
      'ZigStar Stick v4',
      'ZigStar ZigiHAT PoE',
    ]);
  });
});
