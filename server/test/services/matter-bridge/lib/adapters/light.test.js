const { expect } = require('chai');

const light = require('../../../../../services/matter-bridge/lib/adapters/light');
const { COLOR_MODE } = require('../../../../../services/matter-bridge/lib/constants');
const { createMatter, feature, createContext } = require('../../fakes');

const binary = feature('light-binary', 'light', 'binary', { max: 1 });
const brightness = feature('light-brightness', 'light', 'brightness');
const temperature = feature('light-temperature', 'light', 'temperature');
const color = feature('light-color', 'light', 'color', { max: 16777215 });

const listener = (role, attribute) => light.listeners.find((l) => l.role === role && l.attribute === attribute);

describe('Matter bridge light adapter', () => {
  const matter = createMatter();

  it('should group the features of each light, a light needing an on/off feature', () => {
    const other = feature('other-brightness', 'light', 'brightness');
    expect(light.claim([binary, brightness, temperature, color])).to.deep.equal([
      { binary, brightness, temperature, color },
    ]);
    expect(light.claim([brightness])).to.deep.equal([]);
    expect(light.claim([binary, brightness, other])).to.deep.equal([{ binary, brightness }]);
  });

  it('should build an on/off light', () => {
    const { type, state } = light.build(matter, { binary }, createContext({ 'light-binary': 1 }));
    expect(type.name).to.equal('OnOffLightDevice');
    expect(state).to.deep.equal({ onOff: { onOff: true } });
  });

  it('should build a dimmable light', () => {
    const { type, state } = light.build(matter, { binary, brightness }, createContext({ 'light-brightness': 100 }));
    expect(type.name).to.equal('DimmableLightDevice');
    expect(state).to.deep.equal({ onOff: { onOff: false }, levelControl: { currentLevel: 254 } });
  });

  it('should build a dimmable light whose brightness is unknown', () => {
    const { state } = light.build(matter, { binary, brightness }, createContext({}));
    expect(state).to.deep.equal({ onOff: { onOff: false } });
  });

  it('should build a colour temperature light', () => {
    const { type, state } = light.build(matter, { binary, temperature }, createContext({ 'light-temperature': 0 }));
    expect(type.name).to.equal('ColorTemperatureLightDevice');
    const [colorControl] = type.behaviors;
    expect(colorControl.features).to.deep.equal(['ColorTemperature']);
    expect(colorControl.enabled).to.deep.equal({ attributes: { remainingTime: true } });
    expect(state.colorControl).to.include({
      colorMode: COLOR_MODE.COLOR_TEMPERATURE,
      colorTemperatureMireds: 153,
      remainingTime: 0,
    });
  });

  it('should build an extended colour light', () => {
    const { type, state } = light.build(
      matter,
      { binary, temperature, color },
      createContext({ 'light-color': 0xff0000 }),
    );
    expect(type.name).to.equal('ExtendedColorLightDevice');
    expect(type.behaviors[0].features).to.deep.equal(['HueSaturation', 'Xy', 'ColorTemperature']);
    expect(state.colorControl).to.include({
      colorMode: COLOR_MODE.HUE_SATURATION,
      currentHue: 0,
      currentSaturation: 254,
    });
    expect(state.colorControl).to.not.have.property('colorTemperatureMireds');
  });

  it('should build an extended colour light whose colour is unknown', () => {
    const { state } = light.build(matter, { binary, color }, createContext({}));
    expect(state.colorControl).to.not.have.property('currentHue');
  });

  it('should convert Gladys states to Matter', () => {
    const roles = { binary, brightness, temperature, color };
    expect(light.toMatter('binary', 1, roles)).to.deep.equal({ onOff: { onOff: true } });
    expect(light.toMatter('brightness', 0, roles)).to.deep.equal({ levelControl: { currentLevel: 1 } });
    expect(light.toMatter('temperature', 100, roles)).to.deep.equal({
      colorControl: {
        colorTemperatureMireds: 500,
        colorMode: COLOR_MODE.COLOR_TEMPERATURE,
        enhancedColorMode: COLOR_MODE.COLOR_TEMPERATURE,
      },
    });
    expect(light.toMatter('color', 0x00ff00, roles)).to.deep.equal({
      colorControl: {
        currentHue: 85,
        currentSaturation: 254,
        colorMode: COLOR_MODE.HUE_SATURATION,
        enhancedColorMode: COLOR_MODE.HUE_SATURATION,
      },
    });
  });

  it('should convert Matter changes to Gladys values', () => {
    expect(listener('binary', 'onOff').toGladys({ onOff: { onOff: true } })).to.equal(1);
    expect(listener('binary', 'onOff').toGladys({ onOff: { onOff: false } })).to.equal(0);
    const level = listener('brightness', 'currentLevel');
    expect(level.debounce).to.equal(true);
    expect(level.toGladys({ levelControl: { currentLevel: 254 } }, brightness)).to.equal(100);
    expect(level.toGladys({ levelControl: { currentLevel: null } }, brightness)).to.equal(null);
    const mireds = listener('temperature', 'colorTemperatureMireds');
    expect(
      mireds.toGladys(
        { colorControl: { colorMode: COLOR_MODE.COLOR_TEMPERATURE, colorTemperatureMireds: 500 } },
        temperature,
      ),
    ).to.equal(100);
    expect(mireds.toGladys({ colorControl: { colorMode: COLOR_MODE.XY } }, temperature)).to.equal(null);
    const hue = listener('color', 'currentHue');
    expect(
      hue.toGladys({ colorControl: { colorMode: COLOR_MODE.HUE_SATURATION, currentHue: 0, currentSaturation: 254 } }),
    ).to.equal(0xff0000);
    expect(hue.toGladys({ colorControl: { colorMode: COLOR_MODE.XY, currentX: 45940, currentY: 19595 } })).to.equal(
      0xff0000,
    );
    expect(hue.toGladys({ colorControl: { colorMode: COLOR_MODE.COLOR_TEMPERATURE } })).to.equal(null);
  });
});
