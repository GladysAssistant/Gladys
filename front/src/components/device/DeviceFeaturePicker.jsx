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

// The two special filters and the rooms share the chip row: room keys are
// prefixed so a room whose selector is "all" or "selected" stays a room
const ALL_ROOMS = 'filter:all';
const SELECTED_ONLY = 'filter:selected';
const NO_ROOM = 'no-room';
const getRoomKey = device => (device.room ? `room:${device.room.selector || device.room.id}` : NO_ROOM);

const getFeatureIcon = feature => get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`) || 'sliders';

// Rooms (by name, devices without a room last) > devices (by name) >
// features (in the device's own order), each feature carrying the text the
// search matches against: room + device + feature description, and the
// selector it stands for in the selection. With pickDevices a device is one
// row, selected as a whole: its selector is the device's, its icon and value
// those of its first accepted feature.
const buildGroups = (devices, dictionary, filterFeature, pickDevices) => {
  // a Map, not an object: a room selector such as "constructor" must not
  // hit an inherited property
  const rooms = new Map();
  (devices || []).forEach(device => {
    let features = (device.features || [])
      .filter(feature => !filterFeature || filterFeature(feature, device))
      .map(feature => {
        const description = getDeviceFeatureDescription(dictionary, device, feature);
        return { feature, description, selector: feature.selector };
      });
    if (features.length === 0) {
      return;
    }
    if (pickDevices) {
      features = [{ feature: features[0].feature, description: device.name, selector: device.selector }];
    }
    const roomKey = getRoomKey(device);
    if (!rooms.has(roomKey)) {
      rooms.set(roomKey, {
        key: roomKey,
        name: device.room ? device.room.name : get(dictionary, 'device.noRoom'),
        devices: []
      });
    }
    const room = rooms.get(roomKey);
    features.forEach(entry => {
      entry.searchText = normalizeSearchText(
        pickDevices ? `${room.name} ${device.name}` : `${room.name} ${device.name} ${entry.description}`
      );
    });
    room.devices.push({ device, features });
  });
  return Array.from(rooms.values())
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
// Two options for the other callers (the scene forms on a phone):
// - pickDevices: the rows are devices, and the selection device selectors
//   (an action on lights takes lights, not their features);
// - sameKindOnly: every selected feature must share its category and type
//   (the features of a scene trigger are compared with one condition), so
//   once a first feature is ticked only the features of its kind are listed.
class DeviceFeaturePicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: [...(props.selected || [])],
      search: '',
      room: ALL_ROOMS,
      selectedSnapshot: null
    };
    this.groups = buildGroups(props.devices, get(props, 'intl.dictionary'), props.filterFeature, props.pickDevices);
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.devices !== this.props.devices ||
      nextProps.filterFeature !== this.props.filterFeature ||
      nextProps.pickDevices !== this.props.pickDevices
    ) {
      this.groups = buildGroups(
        nextProps.devices,
        get(nextProps, 'intl.dictionary'),
        nextProps.filterFeature,
        nextProps.pickDevices
      );
    }
  }

  // sameKindOnly: the feature every other one must be comparable with, the
  // first of the selection that is still a known feature
  getReferenceFeature(selected) {
    if (!this.props.sameKindOnly) {
      return null;
    }
    for (const selector of selected) {
      for (const group of this.groups) {
        for (const entry of group.devices) {
          const match = entry.features.find(candidate => candidate.selector === selector);
          if (match) {
            return match.feature;
          }
        }
      }
    }
    return null;
  }

  updateSearch = e => {
    this.setState({ search: e.target.value });
  };

  clearSearch = () => {
    this.setState({ search: '' });
  };

  selectRoom = room => {
    // "Selected" lists the selection as it was when the chip was tapped: an
    // unchecked row stays, unticked, so the list does not jump under the
    // finger and a mis-tap can be taken back from this view
    this.setState({ room, selectedSnapshot: room === SELECTED_ONLY ? this.state.selected : null });
  };

  toggleFeature = (selector, event) => {
    const row = event && event.target && event.target.closest ? event.target.closest('label') : null;
    this.setState(
      prevState => ({
        selected: prevState.selected.includes(selector)
          ? prevState.selected.filter(s => s !== selector)
          : [...prevState.selected, selector]
      }),
      () => {
        // sameKindOnly: ticking the first feature (or unticking the last one)
        // changes which rows are listed; the row under the finger stays in view
        if (this.props.sameKindOnly && row && row.isConnected && typeof row.scrollIntoView === 'function') {
          row.scrollIntoView({ block: 'nearest' });
        }
      }
    );
  };

  validate = () => {
    const initial = this.props.selected || [];
    const { selected } = this.state;
    const kept = initial.filter(selector => selected.includes(selector));
    const added = selected.filter(selector => !initial.includes(selector));
    this.props.onValidate([...kept, ...added]);
  };

  getVisibleGroups() {
    const { search, room, selectedSnapshot, selected } = this.state;
    const reference = this.getReferenceFeature(selected);
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
              ({ feature, searchText, selector }) =>
                (room !== SELECTED_ONLY || selectedSnapshot.includes(selector)) &&
                (!reference ||
                  selected.includes(selector) ||
                  (feature.category === reference.category && feature.type === reference.type)) &&
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
        data-cy={`picker-room-${key.replace(':', '-')}`}
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
        entry.features.forEach(({ selector }) => {
          if (selected.includes(selector)) {
            selectedCountByRoom[group.key] += 1;
          }
        })
      );
    });

    return (
      <div class={style.picker} data-cy="device-feature-picker">
        {/* a host with its own header (the dashboard edit panel) shows the back button there */}
        {!props.hideBackButton && (
          <div class={style.backRow}>
            <button type="button" class={style.backButton} onClick={props.onCancel} data-cy="picker-cancel">
              <i class="fe fe-chevron-left" />
              <Text id="deviceFeaturePicker.cancel" />
            </button>
          </div>
        )}

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

        {props.sameKindOnly && this.getReferenceFeature(selected) && (
          <p class={style.hint} data-cy="picker-same-kind-hint">
            <Text id="deviceFeaturePicker.sameKindHint" />
          </p>
        )}

        <div class={style.list}>
          {visibleGroups.map(group => (
            <div key={group.key}>
              <div class={style.roomHeading}>{group.name}</div>
              {group.devices.map(({ device, features }) => (
                <div class={style.device} key={device.selector}>
                  {!props.pickDevices && <div class={style.deviceName}>{device.name}</div>}
                  {features.map(({ feature, description, selector }) => (
                    <label
                      class={cx(style.feature, { [style.featureAlone]: props.pickDevices })}
                      key={selector}
                      data-cy={`picker-feature-${selector}`}
                    >
                      <input
                        type="checkbox"
                        class={style.checkbox}
                        checked={selected.includes(selector)}
                        onChange={event => this.toggleFeature(selector, event)}
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
