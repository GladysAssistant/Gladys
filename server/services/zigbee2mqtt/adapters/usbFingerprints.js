// USB fingerprints of the Zigbee coordinators, to recognize the model of the dongle plugged in a port.
//
// Adapted from the USB_FINGERPRINTS table of zigbee-herdsman v10.10.0 (the version used by Zigbee2mqtt 2.14.2):
// https://github.com/Koenkk/zigbee-herdsman/blob/v10.10.0/src/adapter/adapterDiscovery.ts
// Copyright (c) 2019 Jack Wu, Simen Li, Hedy Wang and Koen Kanters, under the MIT License.
//
// Differences with zigbee-herdsman:
// - a fingerprint gives a model of the Gladys list (adapters/index.js), not only a Zigbee2mqtt adapter type;
// - a port matches only on its vendor id, product id and USB device name (its "pnpId", the name of its
//   /dev/serial/by-id/ link): many coordinators share the 10c4:ea60 chip (CP210x) and the same manufacturer,
//   so only the device name tells them apart (ZBDongle-E "..._Plus_V2_..." vs ZBDongle-P "..._Plus_...");
// - the first matching fingerprint wins, so the most specific ones come first;
// - the SMLIGHT SLZB-06M fingerprint is split by variant, to give the right model;
// - devices shared by several models of the Gladys list are left out (Texas Instruments LaunchPads, TubesZB,
//   ZigStar), as well as the zboss and zigate adapters, not managed by Gladys: their model is chosen by the user.

const ZBDONGLE_E = 'ITead Sonoff Zigbee 3.0 USB Dongle Plus V2 model "ZBDongle-E"';
const ZBT_2 = 'Home Assistant Connect ZBT-2';

const USB_FINGERPRINTS = [
  // deconz
  { vendorId: '1cf1', productId: '0030', pnpId: /conbee/i, adapter: 'ConBee II' },
  { vendorId: '0403', productId: '6015', pnpId: /conbee/i, adapter: 'ConBee III' },
  // ember
  {
    vendorId: '10c4',
    productId: 'ea60',
    pnpId: /Nabu_Casa_SkyConnect/i,
    adapter: 'Home Assistant SkyConnect (by Nabu Casa)',
  },
  { vendorId: '10c4', productId: 'ea60', pnpId: /Nabu_Casa.*_ZBT-1/i, adapter: 'Home Assistant Connect ZBT-1' },
  { vendorId: '303a', productId: '4001', pnpId: /Nabu_Casa_ZBT-2/i, adapter: ZBT_2 },
  { vendorId: '303a', productId: '831a', pnpId: /Nabu_Casa_ZBT-2/i, adapter: ZBT_2 },
  { vendorId: '10c4', productId: 'ea60', pnpId: /slzb-06mg24/i, adapter: 'SMLIGHT SLZB-06Mg24' },
  { vendorId: '10c4', productId: 'ea60', pnpId: /slzb-06mg26/i, adapter: 'SMLIGHT SLZB-06Mg26' },
  { vendorId: '10c4', productId: 'ea60', pnpId: /slzb-06m/i, adapter: 'SMLIGHT SLZB-06M' },
  { vendorId: '10c4', productId: 'ea60', pnpId: /slzb-07_/i, adapter: 'SMLIGHT SLZB-07' },
  { vendorId: '10c4', productId: 'ea60', pnpId: /slzb-07mg24/i, adapter: 'SMLIGHT SLZB-07mg24' },
  // ZBDongle-E, CH9102 variant: usb-ITEAD_SONOFF_Zigbee_3.0_USB_Dongle_Plus_V2_20240122184111-if00
  { vendorId: '1a86', productId: '55d4', pnpId: /sonoff.*plus/i, adapter: ZBDONGLE_E },
  // ZBDongle-E, CP2102N variant: usb-Itead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_V2_8e73883472d9ee11-if00-port0
  { vendorId: '10c4', productId: 'ea60', pnpId: /sonoff.*plus_v2/i, adapter: ZBDONGLE_E },
  { vendorId: '10c4', productId: 'ea60', pnpId: /sonoff.*max/i, adapter: 'SONOFF Dongle-M' },
  { vendorId: '10c4', productId: 'ea60', pnpId: /sonoff.*plus.*mg24/i, adapter: 'SONOFF Dongle-PMG24' },
  {
    vendorId: '10c4',
    productId: 'ea60',
    pnpId: /sonoff.*lite.*mg21/i,
    adapter: 'SONOFF Dongle Lite MG21 Dongle-LMG21',
  },
  // zstack
  { vendorId: '0403', productId: '6015', pnpId: /electrolama/i, adapter: 'Electrolama zig-a-zig-ah! (zzh!)' },
  { vendorId: '10c4', productId: 'ea60', pnpId: /slae\.sh_cc2652rb/i, adapter: "Slaesh's CC2652RB stick" },
  {
    vendorId: '10c4',
    productId: 'ea60',
    pnpId: /sonoff.*plus.*cc2674p10/i,
    adapter: 'SONOFF Dongle Plus CC2674P10 Dongle-PP10',
  },
  // ZBDongle-P: usb-ITead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_d65fba180f86ec11bfdf571719c2d21c-if00-port0
  // After the other "Dongle Plus" of SONOFF (ZBDongle-E, Dongle-PMG24, Dongle-PP10), which it would match too
  {
    vendorId: '10c4',
    productId: 'ea60',
    pnpId: /sonoff.*plus(?!_v2)/i,
    adapter: 'SONOFF Zigbee 3.0 USB Dongle Plus ZBDongle-P',
  },
  { vendorId: '0451', productId: '16c8', pnpId: /CC2538/i, adapter: 'Texas Instruments CC2538' },
  { vendorId: '0451', productId: '16a8', pnpId: /CC2531/i, adapter: 'Texas Instruments CC2531' },
  {
    vendorId: '10c4',
    productId: 'ea60',
    pnpId: /SLZB-07p7/i,
    adapter: 'SMLIGHT SLZB-07p7 Zigbee USB CC2652P7 adapter',
  },
  {
    vendorId: '10c4',
    productId: 'ea60',
    pnpId: /SMLIGHT_SLZB-06p7_/i,
    adapter: 'SMLIGHT SLZB-06p7 Zigbee Ethernet USB POE WiFi LAN adapter',
  },
  {
    vendorId: '10c4',
    productId: 'ea60',
    pnpId: /SMLIGHT_SLZB-06p10_/i,
    adapter: 'SMLIGHT SLZB-06p10 Zigbee Ethernet USB POE WiFi LAN adapter',
  },
];

module.exports = {
  USB_FINGERPRINTS,
};
