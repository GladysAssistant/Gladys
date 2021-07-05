const { expect } = require('chai');
const { COMMAND_CLASSES, INDEXES } = require('../../../../../services/zwave/lib/constants');
const alarmCommandClass = require('../../../../../services/zwave/lib/comClass/alarmCommandClass');

describe('zWave Command Class Alarm', () => {
  it('should returns the valid commClassId', () => {
    expect(alarmCommandClass.getId()).equals(COMMAND_CLASSES.COMMAND_CLASS_ALARM);
  });

  it('should specially normalize Zipato Mini Keypad RFID value', () => {
    const node = {
      productid: '0x4501',
      classes: {
        '113': {
          '7': {
            '1': {
              value_id: '15-113-1-7',
              node_id: 15,
              class_id: 113,
              type: 'list',
              genre: 'user',
              instance: 1,
              index: 7,
              label: 'Home Security',
              units: '',
              help: 'Home Security Alerts',
              read_only: true,
              write_only: false,
              min: 0,
              max: 0,
              is_polled: false,
              values: ['Clear', 'Clear', 'Tampering -  Cover Removed', 'Motion Detected at Unknown Location'],
              value: 'Tampering -  Cover Removed',
            },
          },
          '9': {
            '1': {
              value_id: '15-113-1-9',
              node_id: 15,
              class_id: 113,
              type: 'byte',
              genre: 'user',
              instance: 1,
              index: 9,
              label: 'Previous Event Cleared',
              units: '',
              help: 'Previous Event that was sent',
              read_only: true,
              write_only: false,
              min: 0,
              max: 255,
              is_polled: false,
              value: 0,
            },
          },
        },
      },
    };
    expect(
      alarmCommandClass.getNormalizedValue(node, alarmCommandClass.getId(), INDEXES.INDEX_ALARM_ACCESS_CONTROL, 1, 1),
    ).equal(1);

    expect(
      alarmCommandClass.getNormalizedValue(node, alarmCommandClass.getId(), INDEXES.INDEX_ALARM_ACCESS_CONTROL, 1, 6),
    ).equal(0);
  });

  it('should normalize value with default handler', () => {
    const node = {
      productid: '0x1001',
      classes: {
        '113': {
          '7': {
            '1': {
              value_id: '15-113-1-7',
              node_id: 15,
              class_id: 113,
              type: 'list',
              genre: 'user',
              instance: 1,
              index: 7,
              label: 'Home Security',
              units: '',
              help: 'Home Security Alerts',
              read_only: true,
              write_only: false,
              min: 0,
              max: 0,
              is_polled: false,
              values: ['Clear', 'Clear', 'Tampering -  Cover Removed', 'Motion Detected at Unknown Location'],
              value: 'Tampering -  Cover Removed',
            },
          },
          '9': {
            '1': {
              value_id: '15-113-1-9',
              node_id: 15,
              class_id: 113,
              type: 'byte',
              genre: 'user',
              instance: 1,
              index: 9,
              label: 'Previous Event Cleared',
              units: '',
              help: 'Previous Event that was sent',
              read_only: true,
              write_only: false,
              min: 0,
              max: 255,
              is_polled: false,
              value: 0,
            },
          },
        },
      },
    };
    expect(
      alarmCommandClass.getNormalizedValue(node, alarmCommandClass.getId(), INDEXES.INDEX_ALARM_ACCESS_CONTROL, 1, 1),
    ).equal(1);

    expect(
      alarmCommandClass.getNormalizedValue(node, alarmCommandClass.getId(), INDEXES.INDEX_ALARM_ACCESS_CONTROL, 1, 6),
    ).equal(6);
  });
});
