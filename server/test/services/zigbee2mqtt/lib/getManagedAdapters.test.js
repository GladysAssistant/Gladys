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
      { label: "CircuitSetup's CC2652P2 USB Coordinator", configKey: 'zstack' },
      { label: 'cod.m Zigbee CC2652P RPi Module', configKey: 'zstack' },
      { label: 'cod.m ZigBee CC2652P2 TCP Coordinator', configKey: 'zstack' },
      { label: 'ConBee', configKey: 'deconz' },
      { label: 'ConBee II', configKey: 'deconz' },
      { label: 'CoolKit ZB-GW04 USB dongle (a.k.a. easyiot stick)', configKey: 'ember' },
      { label: 'CoolKit ZB-GW04 USB dongle (a.k.a. easyiot stick) (legacy ezsp)', configKey: 'ezsp' },
      { label: 'cyijun OpenZ3Gateway', configKey: 'zstack' },
      { label: 'Egony Stick V4', configKey: 'zstack' },
      { label: 'Electrolama zig-a-zig-ah! (zzh!)', configKey: 'zstack' },
      { label: 'Elelabs ELU013 and Popp ZB-STICK', configKey: 'ember' },
      { label: 'Elelabs ELU013 and Popp ZB-STICK (legacy ezsp)', configKey: 'ezsp' },
      { label: 'Elelabs Zigbee Raspberry Pi Shield/Popp ZB-Shield', configKey: 'ember' },
      { label: 'Elelabs Zigbee Raspberry Pi Shield/Popp ZB-Shield (legacy ezsp)', configKey: 'ezsp' },
      { label: 'Gio-dot Z-Bee Duo with CC2652P', configKey: 'zstack' },
      { label: 'Home Assistant SkyConnect (by Nabu Casa)', configKey: 'ember' },
      { label: 'Home Assistant SkyConnect (by Nabu Casa) (legacy ezsp)', configKey: 'ezsp' },
      { label: 'ITead Sonoff Zigbee 3.0 USB Dongle Plus V2 model "ZBDongle-E"', configKey: 'ember' },
      { label: 'ITead Sonoff Zigbee 3.0 USB Dongle Plus V2 model "ZBDongle-E" (legacy ezsp)', configKey: 'ezsp' },
      { label: 'RaspBee', configKey: 'deconz' },
      { label: 'RaspBee II', configKey: 'deconz' },
      { label: "Slaesh's CC2652RB stick", configKey: 'zstack' },
      { label: 'SMLIGHT CC2652P Zigbee USB Adapter SLZB-02', configKey: 'zstack' },
      { label: 'SMLIGHT SLZB-06 Zigbee ethernet USB POE WiFi LAN adapter', configKey: 'zstack' },
      { label: 'SMLIGHT Zigbee LAN Adapter CC2652P Model SLZB-05', configKey: 'zstack' },
      { label: 'SONOFF Zigbee 3.0 USB Dongle Plus ZBDongle-P', configKey: 'zstack' },
      { label: 'Texas Instruments CC2530', configKey: 'zstack' },
      { label: 'Texas Instruments CC2531', configKey: 'zstack' },
      { label: 'Texas Instruments CC2538', configKey: 'zstack' },
      { label: 'Texas Instruments CC2538 HAT', configKey: 'zstack' },
      { label: 'Texas Instruments LAUNCHXL-CC1352P-2', configKey: 'zstack' },
      { label: 'Texas Instruments LAUNCHXL-CC26X2R1', configKey: 'zstack' },
      { label: "Tube's CC2652P2 USB Coordinator", configKey: 'zstack' },
      { label: "Tube's Zigbee Gateways (CC2652P2 variant)", configKey: 'zstack' },
      { label: 'TubesZB Zigbee EFR32 pro ethernet/USB serial coordinator', configKey: 'ember' },
      { label: 'TubesZB Zigbee EFR32 pro ethernet/USB serial coordinator (legacy ezsp)', configKey: 'ezsp' },
      { label: 'Vision CC2538+CC2592 Dongle(VS203)', configKey: 'zstack' },
      { label: 'Vision CC2652 dongle', configKey: 'zstack' },
      { label: 'XGG 52PZ2MGateway', configKey: 'zstack' },
      { label: 'XGG Gateway', configKey: 'zstack' },
      { label: 'ZigStar LAN Coordinator', configKey: 'zstack' },
      { label: 'ZigStar PoE Coordinator', configKey: 'zstack' },
      { label: 'ZigStar Stick v4', configKey: 'zstack' },
      { label: 'ZigStar ZigiHAT PoE', configKey: 'zstack' },
    ]);
  });
});
