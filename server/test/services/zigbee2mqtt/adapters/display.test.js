const { expect } = require('chai');

const { ADAPTERS } = require('../../../../services/zigbee2mqtt/adapters');
const {
  LABELS_BY_BRAND,
  DISPLAY_BY_LABEL,
  DISPLAYED_ADAPTERS,
  getAdapterDisplay,
} = require('../../../../services/zigbee2mqtt/adapters/display');

// Photos checked to exist on https://www.zigbee2mqtt.io/images/devices/<image>.png (2026-11-16)
const KNOWN_IMAGES = [
  'Dongle-LMG21',
  'Dongle-M',
  'Dongle-PMG24',
  'Dongle-PP10',
  'SLZB-06',
  'SLZB-06M',
  'SLZB-06Mg24',
  'SLZB-06Mg26',
  'SLZB-06P7',
  'SLZB-06p10',
  'SLZB-07',
  'SLZB-07Mg24',
  'SLZB-07P7',
  'ZBDongle-E',
  'ZBDongle-P',
  'ZBT-2',
];

describe('zigbee2mqtt adapters display', () => {
  it('should give a brand to every model of the list, so that the wizard can group them', () => {
    const missing = ADAPTERS.filter(({ label }) => !getAdapterDisplay(label).brand).map(({ label }) => label);
    expect(missing).to.deep.equal([]);
  });

  it('should only name models of the list', () => {
    const labels = ADAPTERS.map(({ label }) => label);
    const listed = [...Object.values(LABELS_BY_BRAND).flat(), ...Object.keys(DISPLAY_BY_LABEL)];
    expect(listed.filter((label) => !labels.includes(label))).to.deep.equal([]);
  });

  it('should only use photos known to exist', () => {
    const images = Object.values(DISPLAY_BY_LABEL)
      .map(({ image }) => image)
      .filter(Boolean);
    expect(images.filter((image) => !KNOWN_IMAGES.includes(image))).to.deep.equal([]);
  });

  it('should show a model by its commercial name', () => {
    expect(getAdapterDisplay('ITead Sonoff Zigbee 3.0 USB Dongle Plus V2 model "ZBDongle-E"')).to.deep.equal({
      brand: 'SONOFF',
      displayName: 'SONOFF Zigbee 3.0 USB Dongle Plus-E',
      modelCode: 'ZBDongle-E',
      image: 'ZBDongle-E',
      aliases: ['sonoff e', 'dongle e', 'dongle plus e', 'plus v2'],
    });
  });

  it('should show a "(legacy ezsp)" variant as its base model', () => {
    expect(
      getAdapterDisplay('ITead Sonoff Zigbee 3.0 USB Dongle Plus V2 model "ZBDongle-E" (legacy ezsp)'),
    ).to.deep.equal(getAdapterDisplay('ITead Sonoff Zigbee 3.0 USB Dongle Plus V2 model "ZBDongle-E"'));
  });

  it('should show a model without commercial name by its label', () => {
    expect(getAdapterDisplay('Texas Instruments CC2531')).to.deep.equal({
      brand: 'Texas Instruments',
      displayName: 'Texas Instruments CC2531',
      modelCode: null,
      image: null,
      aliases: [],
    });
  });

  it('should show an unknown model by its label, without brand', () => {
    expect(getAdapterDisplay('Some new dongle')).to.deep.equal({
      brand: null,
      displayName: 'Some new dongle',
      modelCode: null,
      image: null,
      aliases: [],
    });
  });

  it('should list every model with how to show it', () => {
    expect(DISPLAYED_ADAPTERS).to.have.lengthOf(ADAPTERS.length);
    expect(DISPLAYED_ADAPTERS.find(({ label }) => label === 'SONOFF Dongle-M')).to.deep.equal({
      label: 'SONOFF Dongle-M',
      configKey: 'ember',
      brand: 'SONOFF',
      displayName: 'SONOFF Dongle Max',
      modelCode: 'Dongle-M',
      image: 'Dongle-M',
      aliases: ['sonoff max', 'sonoff m'],
    });
  });
});
