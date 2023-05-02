const CONFIG_KEYS = {
  DECONZ: 'deconz',
  EZSP: 'ezsp',
  NONE: 'none',
};

const ADAPTERS_BY_CONFIG_KEY = {
  [CONFIG_KEYS.DECONZ]: ['ConBee', 'ConBee II', 'RaspBee', 'RaspBee II'],
  [CONFIG_KEYS.EZSP]: [
    'CoolKit ZB-GW04 USB dongle (a.k.a. easyiot stick)',
    'Elelabs ELU013 and Popp ZB-STICK',
    'Elelabs Zigbee Raspberry Pi Shield/Popp ZB-Shield',
    'Home Assistant SkyConnect (by Nabu Casa)',
    'ITead Sonoff Zigbee 3.0 USB Dongle Plus V2 model "ZBDongle-E"',
    'TubesZB Zigbee EFR32 pro ethernet/USB serial coordinator',
  ],
  [CONFIG_KEYS.NONE]: [
    "CircuitSetup's CC2652P2 USB Coordinator",
    'cod.m Zigbee CC2652P RPi Module',
    'cod.m ZigBee CC2652P2 TCP Coordinator',
    'cyijun OpenZ3Gateway',
    'Egony Stick V4',
    'Electrolama zig-a-zig-ah! (zzh!)',
    'Gio-dot Z-Bee Duo with CC2652P',
    'Texas Instruments CC2530',
    'Texas Instruments CC2531',
    'Texas Instruments CC2538',
    'Texas Instruments CC2538 HAT',
    'Texas Instruments LAUNCHXL-CC1352P-2',
    'Texas Instruments LAUNCHXL-CC26X2R1',
    "Tube's CC2652P2 USB Coordinator",
    "Tube's Zigbee Gateways (CC2652P2 variant)",
    'SONOFF Zigbee 3.0 USB Dongle Plus ZBDongle-P',
    "Slaesh's CC2652RB stick",
    'SMLIGHT CC2652P Zigbee USB Adapter SLZB-02',
    'SMLIGHT SLZB-06 Zigbee ethernet USB POE WiFi LAN adapter',
    'SMLIGHT Zigbee LAN Adapter CC2652P Model SLZB-05',
    'Vision CC2538+CC2592 Dongle(VS203)',
    'Vision CC2652 dongle',
    'XGG Gateway',
    'XGG 52PZ2MGateway',
    'ZigStar LAN Coordinator',
    'ZigStar PoE Coordinator',
    'ZigStar Stick v4',
    'ZigStar ZigiHAT PoE',
  ],
};

const ADAPTERS = Object.values(ADAPTERS_BY_CONFIG_KEY)
  .flatMap((values) => values)
  .sort((a, b) => a.localeCompare(b));

module.exports = { ADAPTERS, ADAPTERS_BY_CONFIG_KEY, CONFIG_KEYS, DEFAULT_KEY: CONFIG_KEYS.NONE };
