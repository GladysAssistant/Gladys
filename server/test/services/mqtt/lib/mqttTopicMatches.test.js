const { expect } = require('chai');

const { mqttTopicMatches } = require('../../../../services/mqtt/lib/mqttTopicMatches');

describe('mqttTopicMatches', () => {
  it('should match an exact topic', () => {
    expect(mqttTopicMatches('my-device/state', 'my-device/state')).to.equal(true);
    expect(mqttTopicMatches('my-device/state', 'my-device/other')).to.equal(false);
  });

  it('should not match a topic with a different number of levels', () => {
    expect(mqttTopicMatches('my-device/state', 'my-device/state/extra')).to.equal(false);
    expect(mqttTopicMatches('my-device/state/extra', 'my-device/state')).to.equal(false);
  });

  it('should match a single "+" wildcard level', () => {
    expect(mqttTopicMatches('home/+/temperature', 'home/livingroom/temperature')).to.equal(true);
    expect(mqttTopicMatches('home/+/temperature', 'home/livingroom/kitchen/temperature')).to.equal(false);
    expect(mqttTopicMatches('home/+/temperature', 'home/livingroom/humidity')).to.equal(false);
  });

  it('should match several "+" wildcard levels', () => {
    expect(mqttTopicMatches('+/+/BTtoMQTT/A4C138800021', 'blegateway/office/BTtoMQTT/A4C138800021')).to.equal(true);
    expect(mqttTopicMatches('+/+/BTtoMQTT/A4C138800021', 'blegateway/BTtoMQTT/A4C138800021')).to.equal(false);
    expect(mqttTopicMatches('+/+/BTtoMQTT/A4C138800021', 'blegateway/office/BTtoMQTT/FFFFFFFFFFFF')).to.equal(false);
  });

  it('should not match a "+" wildcard when the level is missing', () => {
    expect(mqttTopicMatches('home/+', 'home')).to.equal(false);
  });

  it('should match a trailing "#" wildcard', () => {
    expect(mqttTopicMatches('homeassistant/#', 'homeassistant/sensor/my-device/config')).to.equal(true);
    expect(mqttTopicMatches('homeassistant/#', 'homeassistant')).to.equal(true);
    expect(mqttTopicMatches('homeassistant/#', 'other/sensor/config')).to.equal(false);
  });

  it('should match everything with a lone "#"', () => {
    expect(mqttTopicMatches('#', 'any/topic/here')).to.equal(true);
  });

  it('should not match a "#" wildcard that is not the last level', () => {
    expect(mqttTopicMatches('home/#/temperature', 'home/livingroom/temperature')).to.equal(false);
  });

  it('should not interpret regex special characters in topics', () => {
    expect(mqttTopicMatches('my.device/state', 'myxdevice/state')).to.equal(false);
    expect(mqttTopicMatches('my.device/state', 'my.device/state')).to.equal(true);
  });
});
