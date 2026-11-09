import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import DeviceFeatureValueText from './DeviceFeatureValueText';
import { DeviceFeatureCategoriesIcon } from '../../utils/consts';
import { getDeviceFeatureDescription } from '../../utils/device';
import normalizeSearchText from '../../utils/normalizeSearchText';
import withIntlAsProp from '../../utils/withIntlAsProp';
import style from './deviceFeaturePicker.css';

const ALL_ROOMS = 'all';
const SELECTED_ONLY = 'selected';
const NO_ROOM = '__no_room__';

const getFeatureIcon = feature => get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`) || 'sliders';

// Rooms (by name, devices without a room last) > devices (by name) >
// features (in the device's own order), each feature carrying the text the
// search matches against: room + device + feature description
const buildGroups = (devices, dictionary, filterFeature) => {
  const rooms = {};
  (devices || []).forEach(device => {
    const features = (device.features || [])
      .filter(feature => !filterFeature || filterFeature(feature, device))
      .map(feature => {
        const description = getDeviceFeatureDescription(dictionary, device, feature);
        return { feature, description };
      });
    if (features.length === 0) {
      return;
    }
    const roomKey = device.room ? device.room.selector || device.room.id : NO_ROOM;
    if (!rooms[roomKey]) {
      rooms[roomKey] = {
        key: roomKey,
        name: device.room ? device.room.name : get(dictionary, 'device.noRoom'),
        devices: []
      };
    }
    const roomName = rooms[roomKey].name;
    features.forEach(entry => {
      entry.searchText = normalizeSearchText(`${roomName} ${device.name} ${entry.description}`);
    });
    rooms[roomKey].devices.push({ device, features });
  });
  return Object.values(rooms)
    .sort((a, b) => {
      if (a.key === NO_ROOM || b.key === NO_ROOM) {
        return a.key === NO_ROOM ? 1 : -1;
      }
      return String(a.name).localeCompare(String(b.name));
    })
    .map(room => ({ ...room, devices: room.devices.sort((a, b) => a.device.name.localeCompare(b.device.name)) }));
};

// Full-height multi-select of device features, the mobile-first replacement
// of the react-select dropdown (see docs/specs/dashboard-flexible-layout-
// and-widgets.md, A.3.1): search that does not open the keyboard by itself,
// room chips, features grouped by room then device as checkbox rows with
// their current value, and one validation for every addition AND removal.
// The caller owns the data: it passes the devices (GET /api/v1/device, rooms
// included) and the currently selected selectors, and gets the new ordered
// selection back — kept selectors keep their order, new ones are appended in
// the order they were checked.
class DeviceFeaturePicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: [...(props.selected || [])],
      search: '',
      room: ALL_ROOMS
    };
    this.groups = buildGroups(props.devices, get(props, 'intl.dictionary'), props.filterFeature);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.devices !== this.props.devices || nextProps.filterFeature !== this.props.filterFeature) {
      this.groups = buildGroups(nextProps.devices, get(nextProps, 'intl.dictionary'), nextProps.filterFeature);
    }
  }

  updateSearch = e => {
    this.setState({ search: e.target.value });
  };

  clearSearch = () => {
    this.setState({ search: '' });
  };

  selectRoom = room => {
    this.setState({ room });
  };

  toggleFeature = selector => {
    this.setState(prevState => ({
      selected: prevState.selected.includes(selector)
        ? prevState.selected.filter(s => s !== selector)
        : [...prevState.selected, selector]
    }));
  };

  validate = () => {
    const initial = this.props.selected || [];
    const { selected } = this.state;
    const kept = initial.filter(selector => selected.includes(selector));
    const added = selected.filter(selector => !initial.includes(selector));
    this.props.onValidate([...kept, ...added]);
  };

  getVisibleGroups() {
    const { search, room, selected } = this.state;
    const words = normalizeSearchText(search)
      .split(/\s+/)
      .filter(Boolean);
    return this.groups
      .filter(group => room === ALL_ROOMS || room === SELECTED_ONLY || group.key === room)
      .map(group => ({
        ...group,
        devices: group.devices
          .map(entry => ({
            ...entry,
            features: entry.features.filter(
              ({ feature, searchText }) =>
                (room !== SELECTED_ONLY || selected.includes(feature.selector)) &&
                words.every(word => searchText.includes(word))
            )
          }))
          .filter(entry => entry.features.length > 0)
      }))
      .filter(group => group.devices.length > 0);
  }

  renderRoomChip(key, label, count) {
    return (
      <button
        type="button"
        class={style.roomChip}
        aria-pressed={this.state.room === key ? 'true' : 'false'}
        onClick={() => this.selectRoom(key)}
        data-cy={`picker-room-${key}`}
      >
        {label}
        {count > 0 && <span class={style.roomChipCount}>{count}</span>}
      </button>
    );
  }

  render(props, { selected, search, room }) {
    const initial = props.selected || [];
    const addedCount = selected.filter(selector => !initial.includes(selector)).length;
    const removedCount = initial.filter(selector => !selected.includes(selector)).length;
    const visibleGroups = this.getVisibleGroups();
    const selectedCountByRoom = {};
    this.groups.forEach(group => {
      selectedCountByRoom[group.key] = 0;
      group.devices.forEach(entry =>
        entry.features.forEach(({ feature }) => {
          if (selected.includes(feature.selector)) {
            selectedCountByRoom[group.key] += 1;
          }
        })
      );
    });

    return (
      <div class={style.picker} data-cy="device-feature-picker">
        <div class={style.backRow}>
          <button type="button" class={style.backButton} onClick={props.onCancel} data-cy="picker-cancel">
            <i class="fe fe-chevron-left" />
            <Text id="deviceFeaturePicker.cancel" />
          </button>
        </div>

        <div class={style.search}>
          <i class={cx('fe fe-search', style.searchIcon)} aria-hidden="true" />
          <Localizer>
            <input
              type="search"
              class={cx('form-control', style.searchInput)}
              value={search}
              onInput={this.updateSearch}
              placeholder={<Text id="deviceFeaturePicker.searchPlaceholder" />}
              aria-label={<Text id="deviceFeaturePicker.searchLabel" />}
              autocomplete="off"
              data-cy="picker-search"
            />
          </Localizer>
          {search && (
            <Localizer>
              <button
                type="button"
                class={style.clearButton}
                onClick={this.clearSearch}
                aria-label={<Text id="deviceFeaturePicker.clearSearch" />}
              >
                <i class="fe fe-x" />
              </button>
            </Localizer>
          )}
        </div>

        <Localizer>
          <div class={style.roomChips} role="group" aria-label={<Text id="deviceFeaturePicker.roomsLabel" />}>
            {this.renderRoomChip(ALL_ROOMS, <Text id="deviceFeaturePicker.allRooms" />, 0)}
            {this.renderRoomChip(SELECTED_ONLY, <Text id="deviceFeaturePicker.selectedFilter" />, selected.length)}
            {this.groups.map(group => this.renderRoomChip(group.key, group.name, selectedCountByRoom[group.key]))}
          </div>
        </Localizer>

        <div class={style.list}>
          {visibleGroups.map(group => (
            <div key={group.key}>
              <div class={style.roomHeading}>{group.name}</div>
              {group.devices.map(({ device, features }) => (
                <div class={style.device} key={device.selector}>
                  <div class={style.deviceName}>{device.name}</div>
                  {features.map(({ feature, description }) => (
                    <label class={style.feature} key={feature.selector} data-cy={`picker-feature-${feature.selector}`}>
                      <input
                        type="checkbox"
                        class={style.checkbox}
                        checked={selected.includes(feature.selector)}
                        onChange={() => this.toggleFeature(feature.selector)}
                      />
                      <span class={style.tick} aria-hidden="true">
                        <i class="fe fe-check" />
                      </span>
                      <span class={style.featureIcon} aria-hidden="true">
                        <i class={`fe fe-${getFeatureIcon(feature)}`} />
                      </span>
                      <span class={style.featureName}>{description}</span>
                      <span class={style.featureValue}>
                        <DeviceFeatureValueText feature={feature} />
                      </span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          ))}
          {visibleGroups.length === 0 && (
            <div class={style.empty}>
              {this.groups.length === 0 && <Text id="deviceFeaturePicker.noDevice" />}
              {this.groups.length > 0 && search && <Text id="deviceFeaturePicker.noResult" fields={{ search }} />}
              {this.groups.length > 0 && !search && room === SELECTED_ONLY && (
                <Text id="deviceFeaturePicker.noSelection" />
              )}
            </div>
          )}
        </div>

        <div class={style.footer}>
          <span class={style.diff} data-cy="picker-diff">
            {addedCount > 0 && <span class={style.diffAdded}>+{addedCount}</span>}
            {addedCount > 0 && removedCount > 0 && ' · '}
            {removedCount > 0 && <span class={style.diffRemoved}>−{removedCount}</span>}
            {addedCount === 0 && removedCount === 0 && (
              <Text
                id="deviceFeaturePicker.selectedCount"
                plural={selected.length}
                fields={{ count: selected.length }}
              />
            )}
          </span>
          <button type="button" class={style.validateButton} onClick={this.validate} data-cy="picker-validate">
            <Text id="deviceFeaturePicker.validate" />
          </button>
        </div>
      </div>
    );
  }
}

export default withIntlAsProp(DeviceFeaturePicker);
