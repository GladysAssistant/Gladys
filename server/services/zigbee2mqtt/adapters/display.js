const { ADAPTERS } = require('./index');

// How the setup wizard shows a coordinator model: under its brand, by its commercial name, with the model code
// printed on it, its photo and the words people search it by. The stored label (ZIGBEE_DONGLE_NAME) never
// changes, the Zigbee2mqtt configuration relies on it.

const LEGACY_EZSP_SUFFIX = ' (legacy ezsp)';

// Every model of the list, by brand, so that the wizard groups them
const LABELS_BY_BRAND = {
  Aeotec: ['Aeotec Zi-Stick (ZGA008)'],
  CircuitSetup: ["CircuitSetup's CC2652P2 USB Coordinator"],
  'cod.m': [
    'cod.m Zigbee CC2652P RPi Module',
    'cod.m ZigBee CC2652P2 TCP Coordinator',
    'cod.m Zigbee Coordinator CC2652P7 (CZC-1.0)',
  ],
  CoolKit: ['CoolKit ZB-GW04 USB dongle (a.k.a. easyiot stick)'],
  cyijun: ['cyijun OpenZ3Gateway'],
  'dresden elektronik': ['ConBee', 'ConBee II', 'ConBee III', 'RaspBee', 'RaspBee II'],
  Egony: ['Egony Stick V4'],
  Electrolama: ['Electrolama zig-a-zig-ah! (zzh!)'],
  Elelabs: ['Elelabs ELU013 and Popp ZB-STICK', 'Elelabs Zigbee Raspberry Pi Shield/Popp ZB-Shield'],
  'Gio-dot': ['Gio-dot Z-Bee Duo with CC2652P'],
  'Home Assistant': [
    'Home Assistant Connect ZBT-1',
    'Home Assistant Connect ZBT-2',
    'Home Assistant SkyConnect (by Nabu Casa)',
    'Nabu Casa Home Assistant Yellow',
  ],
  JetHome: ['JetHome JetHub D1+', 'JetHome JetStick Z2/ZB6UX CC2652P1'],
  'Seeed Studio': ['Seeed Studio XIAO MG24'],
  Slaesh: ["Slaesh's CC2652RB stick"],
  SMLIGHT: [
    'SMLIGHT CC2652P Zigbee USB Adapter SLZB-02',
    'SMLIGHT SLZB-06 Zigbee ethernet USB POE WiFi LAN adapter',
    'SMLIGHT SLZB-06M',
    'SMLIGHT SLZB-06Mg24',
    'SMLIGHT SLZB-06Mg26',
    'SMLIGHT SLZB-06p10 Zigbee Ethernet USB POE WiFi LAN adapter',
    'SMLIGHT SLZB-06p7 Zigbee Ethernet USB POE WiFi LAN adapter',
    'SMLIGHT SLZB-07',
    'SMLIGHT SLZB-07mg24',
    'SMLIGHT SLZB-07p7 Zigbee USB CC2652P7 adapter',
    'SMLIGHT SLZB-MR Series (MR1/MR2/MR3/MR4) MultiRadio Zigbee + Matter-over-Thread Ethernet USB POE Wi-Fi BLE LAN adapter',
    'SMLIGHT SLZB-MR1 MultiRadio Zigbee+Matter-over-Thread Ethernet USB POE WiFi LAN adapter',
    'SMLIGHT SLZB-MR2 MultiRadio Zigbee+Matter-over-Thread Ethernet USB POE WiFi LAN adapter',
    'SMLIGHT SLZB-MR3 MultiRadio Zigbee+Matter-over-Thread Ethernet USB POE WiFi LAN adapter',
    'SMLIGHT SLZB-Ultima - Multi-radio gateway for Zigbee, Thread, Z-Wave, 4G/LTE, IR, Ethernet/Wi-Fi, Voice',
    'SMLIGHT SMHUB (Essential/Premium variants)',
    'SMLIGHT SMHUB Nano Mg24',
    'SMLIGHT Zigbee LAN Adapter CC2652P Model SLZB-05',
  ],
  SONOFF: [
    'ITead Sonoff Zigbee 3.0 USB Dongle Plus V2 model "ZBDongle-E"',
    'SONOFF Dongle Lite MG21 Dongle-LMG21',
    'SONOFF Dongle Plus CC2674P10 Dongle-PP10',
    'SONOFF Dongle-M',
    'SONOFF Dongle-PMG24',
    'SONOFF Zigbee 3.0 USB Dongle Plus ZBDongle-P',
  ],
  'Texas Instruments': [
    'Texas Instruments CC2530',
    'Texas Instruments CC2531',
    'Texas Instruments CC2538',
    'Texas Instruments CC2538 HAT',
    'Texas Instruments LAUNCHXL-CC1352P-2',
    'Texas Instruments LAUNCHXL-CC26X2R1',
    'Texas Instruments LP-CC1352P7',
    'Texas Instruments LP-CC2652R7',
  ],
  TubesZB: [
    "Tube's CC2652P2 USB Coordinator",
    "Tube's Zigbee Gateways (CC2652P2 variant)",
    'TubesZB Zigbee EFR32 pro ethernet/USB serial coordinator',
    'TubeZB EFR32 MGM24 POE',
  ],
  Vision: ['Vision CC2538+CC2592 Dongle(VS203)', 'Vision CC2652 dongle'],
  XGG: ['XGG Gateway', 'XGG 52PZ2MGateway'],
  'Z-Wave.Me': ['Z-WAVE>ME Z-Station (EFR32MG21P)'],
  Zbgw: ['Zbgw_pro EFR32 LAN'],
  ZigStar: [
    'ZigStar LAN Coordinator',
    'ZigStar PoE Coordinator',
    'ZigStar Stick v4',
    'ZigStar UZG-01 - Universal Zigbee Gateway',
    'ZigStar ZigiHAT PoE',
  ],
};

// The common models, by their commercial name. `image` is the name of their photo on zigbee2mqtt.io
// (https://www.zigbee2mqtt.io/images/devices/<image>.png), checked to exist; none for a model without photo there.
const DISPLAY_BY_LABEL = {
  'ITead Sonoff Zigbee 3.0 USB Dongle Plus V2 model "ZBDongle-E"': {
    displayName: 'SONOFF Zigbee 3.0 USB Dongle Plus-E',
    modelCode: 'ZBDongle-E',
    image: 'ZBDongle-E',
    aliases: ['sonoff e', 'dongle e', 'plus v2'],
  },
  'SONOFF Zigbee 3.0 USB Dongle Plus ZBDongle-P': {
    displayName: 'SONOFF Zigbee 3.0 USB Dongle Plus-P',
    modelCode: 'ZBDongle-P',
    image: 'ZBDongle-P',
    aliases: ['sonoff p', 'dongle p'],
  },
  'SONOFF Dongle-M': {
    displayName: 'SONOFF Dongle Max',
    modelCode: 'Dongle-M',
    image: 'Dongle-M',
    aliases: ['sonoff max', 'sonoff m'],
  },
  'SONOFF Dongle Lite MG21 Dongle-LMG21': {
    displayName: 'SONOFF Dongle Lite MG21',
    modelCode: 'Dongle-LMG21',
    image: 'Dongle-LMG21',
    aliases: ['sonoff lite'],
  },
  'SONOFF Dongle-PMG24': {
    displayName: 'SONOFF Dongle Plus MG24',
    modelCode: 'Dongle-PMG24',
    image: 'Dongle-PMG24',
    aliases: ['sonoff mg24'],
  },
  'SONOFF Dongle Plus CC2674P10 Dongle-PP10': {
    displayName: 'SONOFF Dongle Plus CC2674P10',
    modelCode: 'Dongle-PP10',
    image: 'Dongle-PP10',
    aliases: ['sonoff p10'],
  },
  'Home Assistant Connect ZBT-1': {
    displayName: 'Home Assistant Connect ZBT-1',
    modelCode: 'ZBT-1',
    aliases: ['skyconnect', 'nabu casa'],
  },
  'Home Assistant SkyConnect (by Nabu Casa)': {
    displayName: 'Home Assistant SkyConnect',
    modelCode: 'SkyConnect',
    aliases: ['zbt-1', 'nabu casa'],
  },
  'Home Assistant Connect ZBT-2': {
    displayName: 'Home Assistant Connect ZBT-2',
    modelCode: 'ZBT-2',
    image: 'ZBT-2',
    aliases: ['nabu casa'],
  },
  'Nabu Casa Home Assistant Yellow': {
    displayName: 'Home Assistant Yellow',
    aliases: ['nabu casa'],
  },
  ConBee: { displayName: 'dresden elektronik ConBee', aliases: ['deconz'] },
  'ConBee II': { displayName: 'dresden elektronik ConBee II', aliases: ['conbee 2', 'deconz'] },
  'ConBee III': { displayName: 'dresden elektronik ConBee III', aliases: ['conbee 3', 'deconz'] },
  RaspBee: { displayName: 'dresden elektronik RaspBee', aliases: ['deconz'] },
  'RaspBee II': { displayName: 'dresden elektronik RaspBee II', aliases: ['raspbee 2', 'deconz'] },
  'SMLIGHT CC2652P Zigbee USB Adapter SLZB-02': { displayName: 'SMLIGHT SLZB-02', modelCode: 'SLZB-02' },
  'SMLIGHT Zigbee LAN Adapter CC2652P Model SLZB-05': { displayName: 'SMLIGHT SLZB-05', modelCode: 'SLZB-05' },
  'SMLIGHT SLZB-06 Zigbee ethernet USB POE WiFi LAN adapter': {
    displayName: 'SMLIGHT SLZB-06',
    modelCode: 'SLZB-06',
    image: 'SLZB-06',
  },
  'SMLIGHT SLZB-06M': { displayName: 'SMLIGHT SLZB-06M', modelCode: 'SLZB-06M', image: 'SLZB-06M' },
  'SMLIGHT SLZB-06Mg24': { displayName: 'SMLIGHT SLZB-06Mg24', modelCode: 'SLZB-06Mg24', image: 'SLZB-06Mg24' },
  'SMLIGHT SLZB-06Mg26': { displayName: 'SMLIGHT SLZB-06Mg26', modelCode: 'SLZB-06Mg26', image: 'SLZB-06Mg26' },
  'SMLIGHT SLZB-06p7 Zigbee Ethernet USB POE WiFi LAN adapter': {
    displayName: 'SMLIGHT SLZB-06p7',
    modelCode: 'SLZB-06p7',
    image: 'SLZB-06P7',
  },
  'SMLIGHT SLZB-06p10 Zigbee Ethernet USB POE WiFi LAN adapter': {
    displayName: 'SMLIGHT SLZB-06p10',
    modelCode: 'SLZB-06p10',
    image: 'SLZB-06p10',
  },
  'SMLIGHT SLZB-07': { displayName: 'SMLIGHT SLZB-07', modelCode: 'SLZB-07', image: 'SLZB-07' },
  'SMLIGHT SLZB-07mg24': { displayName: 'SMLIGHT SLZB-07mg24', modelCode: 'SLZB-07mg24', image: 'SLZB-07Mg24' },
  'SMLIGHT SLZB-07p7 Zigbee USB CC2652P7 adapter': {
    displayName: 'SMLIGHT SLZB-07p7',
    modelCode: 'SLZB-07p7',
    image: 'SLZB-07P7',
  },
};

const BRAND_BY_LABEL = Object.fromEntries(
  Object.entries(LABELS_BY_BRAND).flatMap(([brand, labels]) => labels.map((label) => [label, brand])),
);

/**
 * @description How to show a coordinator model: its brand, commercial name, model code, photo and search
 * aliases. A "(legacy ezsp)" variant is shown as its base model.
 * @param {string} label - Model label, as stored (ZIGBEE_DONGLE_NAME).
 * @returns {object} `{ brand, displayName, modelCode, image, aliases }`; the label as name, and nulls, for a model
 * without commercial name.
 * @example
 * getAdapterDisplay('SONOFF Dongle-M'); // { brand: 'SONOFF', displayName: 'SONOFF Dongle Max', ... }
 */
function getAdapterDisplay(label) {
  const baseLabel = label.endsWith(LEGACY_EZSP_SUFFIX) ? label.slice(0, -LEGACY_EZSP_SUFFIX.length) : label;
  const display = DISPLAY_BY_LABEL[baseLabel] || {};
  return {
    brand: BRAND_BY_LABEL[baseLabel] || null,
    displayName: display.displayName || baseLabel,
    modelCode: display.modelCode || null,
    image: display.image || null,
    aliases: display.aliases || [],
  };
}

// The list of the setup page, each model once with how to show it. A model listed by two drivers (SLZB-Ultima, SMHUB)
// keeps the first one, the one configureContainer installs it with
const DISPLAYED_ADAPTERS = ADAPTERS.filter(
  (adapter, index) => ADAPTERS.findIndex((other) => other.label === adapter.label) === index,
).map((adapter) => ({ ...adapter, ...getAdapterDisplay(adapter.label) }));

module.exports = {
  LABELS_BY_BRAND,
  DISPLAY_BY_LABEL,
  DISPLAYED_ADAPTERS,
  getAdapterDisplay,
};
