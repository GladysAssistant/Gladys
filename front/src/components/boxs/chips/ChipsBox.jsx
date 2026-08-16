import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import {
  WEBSOCKET_MESSAGE_TYPES,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  OPENING_SENSOR_STATE
} from '../../../../../server/utils/constants';
import { DeviceFeatureCategoriesIcon } from '../../../utils/consts';
import DeviceFeatureValueText from '../../device/DeviceFeatureValueText';
import get from 'get-value';
import style from './style.css';

dayjs.extend(localizedFormat);

const CHIP_TYPE_DEFAULT_ICONS = {
  'device-feature': 'circle',
  openings: 'home',
  alarm: 'shield',
  'calendar-next-event': 'calendar'
};

class ChipsBox extends Component {
  refreshData = async () => {
    const chips = this.props.box.chips || [];
    const chipsData = await Promise.all(chips.map(chip => this.loadChip(chip)));
    this.setState({ chipsData });
  };

  loadChip = async chip => {
    try {
      switch (chip.chip_type) {
        case 'device-feature': {
          if (!chip.device_feature) {
            return { notConfigured: true };
          }
          const devices = await this.props.httpClient.get('/api/v1/device', {
            device_feature_selectors: chip.device_feature
          });
          if (!devices.length) {
            return { error: true };
          }
          const device = devices[0];
          const feature = device.features.find(f => f.selector === chip.device_feature);
          return { device, feature };
        }
        case 'openings': {
          const rooms = await this.props.httpClient.get('/api/v1/room', { expand: 'devices' });
          let scopeRooms = rooms;
          if (chip.room) {
            scopeRooms = rooms.filter(room => room.selector === chip.room);
          } else if (chip.house) {
            const house = await this.props.httpClient.get(`/api/v1/house/${chip.house}`);
            scopeRooms = rooms.filter(room => room.house_id === house.id);
          }
          const openingFeatures = {};
          scopeRooms.forEach(room => {
            room.devices.forEach(device => {
              device.features.forEach(feature => {
                if (
                  feature.category === DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR &&
                  feature.type === DEVICE_FEATURE_TYPES.SENSOR.BINARY
                ) {
                  openingFeatures[feature.selector] = feature.last_value;
                }
              });
            });
          });
          return { openingFeatures };
        }
        case 'alarm': {
          if (!chip.house) {
            return { notConfigured: true };
          }
          const house = await this.props.httpClient.get(`/api/v1/house/${chip.house}`);
          return { alarmMode: house.alarm_mode };
        }
        case 'calendar-next-event': {
          const from = new Date().toISOString();
          const to = dayjs()
            .add(60, 'day')
            .toISOString();
          const events = await this.props.httpClient.get('/api/v1/calendar/event', { from, to, shared: true });
          const nameFilter = (chip.calendar_event_name_filter || '').toLowerCase();
          const now = new Date();
          const nextEvent = events
            .filter(event => {
              if (chip.calendars && chip.calendars.length > 0) {
                if (!event.calendar || !chip.calendars.includes(event.calendar.selector)) {
                  return false;
                }
              }
              if (nameFilter && !(event.name || '').toLowerCase().includes(nameFilter)) {
                return false;
              }
              return new Date(event.start) >= now;
            })
            .sort((a, b) => new Date(a.start) - new Date(b.start))[0];
          return { event: nextEvent || null };
        }
        default:
          return { notConfigured: true };
      }
    } catch (e) {
      console.error(e);
      return { error: true };
    }
  };

  updateDeviceStateWebsocket = payload => {
    const chips = this.props.box.chips || [];
    const { chipsData } = this.state;
    if (!chipsData) {
      return;
    }
    let hasChanged = false;
    const newChipsData = chipsData.map((data, index) => {
      const chip = chips[index];
      if (!chip || !data) {
        return data;
      }
      if (
        chip.chip_type === 'device-feature' &&
        data.feature &&
        payload.device_feature_selector === chip.device_feature
      ) {
        hasChanged = true;
        return {
          ...data,
          feature: { ...data.feature, last_value: payload.last_value, last_value_changed: payload.last_value_changed }
        };
      }
      if (
        chip.chip_type === 'openings' &&
        data.openingFeatures &&
        payload.device_feature_selector in data.openingFeatures
      ) {
        hasChanged = true;
        return {
          ...data,
          openingFeatures: { ...data.openingFeatures, [payload.device_feature_selector]: payload.last_value }
        };
      }
      return data;
    });
    if (hasChanged) {
      this.setState({ chipsData: newChipsData });
    }
  };

  refreshAlarmChips = async () => {
    const chips = this.props.box.chips || [];
    const { chipsData } = this.state;
    if (!chipsData) {
      return;
    }
    const newChipsData = await Promise.all(
      chipsData.map((data, index) => {
        const chip = chips[index];
        if (chip && chip.chip_type === 'alarm') {
          return this.loadChip(chip);
        }
        return Promise.resolve(data);
      })
    );
    this.setState({ chipsData: newChipsData });
  };

  componentDidMount() {
    this.refreshData();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
    Object.keys(WEBSOCKET_MESSAGE_TYPES.ALARM).forEach(key => {
      this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ALARM[key], this.refreshAlarmChips);
    });
  }

  componentDidUpdate(previousProps) {
    if (previousProps.box.chips !== this.props.box.chips) {
      this.refreshData();
    }
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
    Object.keys(WEBSOCKET_MESSAGE_TYPES.ALARM).forEach(key => {
      this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ALARM[key], this.refreshAlarmChips);
    });
  }

  getChipIcon = (chip, data) => {
    if (chip.icon) {
      return chip.icon;
    }
    if (chip.chip_type === 'device-feature' && data && data.feature) {
      const icon = get(DeviceFeatureCategoriesIcon, `${data.feature.category}.${data.feature.type}`);
      if (icon) {
        return icon;
      }
    }
    return CHIP_TYPE_DEFAULT_ICONS[chip.chip_type];
  };

  renderChip = (chip, data) => {
    if (!data || data.notConfigured) {
      return null;
    }
    if (data.error) {
      return { value: <Text id="dashboard.boxes.chips.error" />, warning: true };
    }
    switch (chip.chip_type) {
      case 'device-feature':
        return {
          label: chip.label || (data.device && data.device.name),
          value: <DeviceFeatureValueText feature={data.feature} />
        };
      case 'openings': {
        const values = Object.keys(data.openingFeatures || {}).map(selector => data.openingFeatures[selector]);
        const openCount = values.filter(value => value === OPENING_SENSOR_STATE.OPEN).length;
        return {
          label: chip.label,
          value:
            openCount > 0 ? (
              <Text id="dashboard.boxes.chips.openings" fields={{ count: openCount }} />
            ) : (
              <Text id="dashboard.boxes.chips.allClosed" />
            ),
          warning: openCount > 0
        };
      }
      case 'alarm':
        return {
          label: chip.label,
          value: <Text id={`dashboard.boxes.chips.alarmModes.${data.alarmMode}`} />
        };
      case 'calendar-next-event': {
        if (!data.event) {
          return { label: chip.label, value: <Text id="dashboard.boxes.chips.noEvent" /> };
        }
        const eventDate = dayjs(data.event.start)
          .locale(this.props.user.language)
          .format('ddd ll');
        return {
          label: chip.label || data.event.name,
          value: chip.label ? `${data.event.name} · ${eventDate}` : eventDate
        };
      }
      default:
        return null;
    }
  };

  render(props, { chipsData }) {
    const chips = props.box.chips || [];
    return (
      <div class={style.chipsBar}>
        {chips.map((chip, index) => {
          const rendered = this.renderChip(chip, chipsData && chipsData[index]);
          if (!rendered) {
            return null;
          }
          return (
            <div class={cx(style.chip, { [style.chipWarning]: rendered.warning })}>
              <span class={style.chipIcon}>
                <i class={`fe fe-${this.getChipIcon(chip, chipsData && chipsData[index])}`} />
              </span>
              {rendered.label && <span class={style.chipLabel}>{rendered.label}</span>}
              <span class={style.chipValue}>{rendered.value}</span>
            </div>
          );
        })}
      </div>
    );
  }
}

export default connect('httpClient,session,user', {})(ChipsBox);
