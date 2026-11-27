import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import DeviceFeatureValueText from './DeviceFeatureValueText';
import { DeviceFeatureCategoriesIcon } from '../../utils/consts';
import { getDeviceFeatureDescription } from '../../utils/device';
import {
  getLightCssColor,
  getLightFeature,
  isLightPanelFeature,
  valueToPercent
} from '../boxs/device-in-room/device-features/light/lightFeatures';
import { DEVICE_FEATURE_TYPES } from '../../../../server/utils/constants';
import normalizeSearchText from '../../utils/normalizeSearchText';
import withIntlAsProp from '../../utils/withIntlAsProp';
import style from './deviceFeaturePicker.css';

// The two special filters and the rooms share the chip row: room keys are
// prefixed so a room whose selector is "all" or "selected" stays a room
const ALL_ROOMS = 'filter:all';
const SELECTED_ONLY = 'filter:selected';
const NO_ROOM = 'no-room';
const getRoomKey = device => (device.room ? `room:${device.room.selector || device.room.id}` : NO_ROOM);

const getFeatureIcon = (feature, defaultIcon) =>
  (feature && get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`)) || defaultIcon || 'sliders';

const hasValue = feature => Boolean(feature) && feature.last_value !== null && feature.last_value !== undefined;

// How many suggestion rows are shown above the list
const MAX_SUGGESTION_ROWS = 6;

// groupLights: the controllable light features of a same device (on/off, brightness, color...)
// make ONE row, like the devices widget shows them (buildDeviceRows): ticking it takes the whole
// light. Same rule as the widget — something to dose besides on/off, and no type twice (two bulbs
// on one device keep their per-feature rows). The row can be opened to pick its features one by one.
const getLightEntries = entries => {
  const lightEntries = entries.filter(entry => isLightPanelFeature(entry.feature));
  const types = lightEntries.map(entry => entry.feature.type);
  const dosable = types.some(type => type !== DEVICE_FEATURE_TYPES.LIGHT.BINARY);
  if (lightEntries.length < 2 || !dosable || new Set(types).size !== types.length) {
    return null;
  }
  return lightEntries;
};

// The rows of a device: its features, a light being one row standing where its first feature was
const buildRows = (device, entries, roomName, groupLights) => {
  const lightEntries = groupLights ? getLightEntries(entries) : null;
  if (!lightEntries) {
    return entries.map(entry => ({ ...entry, kind: 'feature', key: entry.selector }));
  }
  const rows = [];
  entries.forEach(entry => {
    if (!lightEntries.includes(entry)) {
      rows.push({ ...entry, kind: 'feature', key: entry.selector });
    } else if (entry === lightEntries[0]) {
      rows.push({
        kind: 'light',
        key: `light:${device.selector}`,
        device,
        features: lightEntries,
        selectors: lightEntries.map(lightEntry => lightEntry.selector),
        searchText: normalizeSearchText(
          `${roomName} ${device.name} ${lightEntries.map(lightEntry => lightEntry.description).join(' ')}`
        )
      });
    }
  });
  return rows;
};

// Rooms (by name, devices without a room last) > devices (by name) >
// features (in the device's own order), each feature carrying the text the
// search matches against: room + device + feature description, and the
// selector it stands for in the selection. With pickDevices a device is one
// row, selected as a whole: its selector is the device's, its icon and value
// those of its first accepted feature.
const buildGroups = (devices, dictionary, filterFeature, pickDevices, groupLights) => {
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
    // pickDevices: the caller lists the devices it wants, with or without a feature to show
    if (features.length === 0 && !pickDevices) {
      return;
    }
    if (pickDevices) {
      features = [
        { feature: features[0] ? features[0].feature : null, description: device.name, selector: device.selector }
      ];
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
    room.devices.push({ device, features, rows: buildRows(device, features, room.name, groupLights && !pickDevices) });
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
//   once a first feature is ticked only the features of its kind are listed;
// - single: one device at most. A row is a radio: tapping it validates the
//   picker at once with that selection, there is nothing to confirm.
class DeviceFeaturePicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: [...(props.selected || [])],
      search: '',
      room: ALL_ROOMS,
      selectedSnapshot: null,
      expandedLights: []
    };
    this.setGroups(props);
  }

  // The rows by room, and where each selector stands: its row (a light is one row for several
  // selectors), its device and its room — the counts and the suggestions read them
  setGroups(props) {
    this.groups = buildGroups(
      props.devices,
      get(props, 'intl.dictionary'),
      props.filterFeature,
      props.pickDevices,
      props.groupLights
    );
    this.rowBySelector = new Map();
    this.groups.forEach(group =>
      group.devices.forEach(({ device, rows }) =>
        rows.forEach(row => {
          const located = { row, device, room: group };
          (row.kind === 'light' ? row.selectors : [row.selector]).forEach(selector =>
            this.rowBySelector.set(selector, located)
          );
        })
      )
    );
  }

  getRowKey = selector => {
    const located = this.rowBySelector.get(selector);
    return located ? located.row.key : selector;
  };

  countRows = selectors => new Set(selectors.map(this.getRowKey)).size;

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.devices !== this.props.devices ||
      nextProps.filterFeature !== this.props.filterFeature ||
      nextProps.pickDevices !== this.props.pickDevices ||
      nextProps.groupLights !== this.props.groupLights
    ) {
      this.setGroups(nextProps);
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
    if (this.props.single) {
      this.props.onValidate([selector]);
      return;
    }
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

  // A light row takes or leaves the whole light: every feature it groups is ticked unless they
  // all are already
  toggleSelectors = selectors => {
    this.setState(prevState => {
      const all = selectors.every(selector => prevState.selected.includes(selector));
      return {
        selected: all
          ? prevState.selected.filter(selector => !selectors.includes(selector))
          : [...prevState.selected, ...selectors.filter(selector => !prevState.selected.includes(selector))]
      };
    });
  };

  toggleExpanded = key => {
    this.setState(prevState => ({
      expandedLights: prevState.expandedLights.includes(key)
        ? prevState.expandedLights.filter(other => other !== key)
        : [...prevState.expandedLights, key]
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
    const { search, room, selectedSnapshot, selected } = this.state;
    const reference = this.getReferenceFeature(selected);
    const words = normalizeSearchText(search)
      .split(/\s+/)
      .filter(Boolean);
    const featureVisible = ({ feature, searchText, selector }) =>
      (room !== SELECTED_ONLY || selectedSnapshot.includes(selector)) &&
      (!reference ||
        selected.includes(selector) ||
        (feature.category === reference.category && feature.type === reference.type)) &&
      words.every(word => searchText.includes(word));
    const rowVisible = row =>
      row.kind === 'light'
        ? (room !== SELECTED_ONLY || row.selectors.some(selector => selectedSnapshot.includes(selector))) &&
          !reference &&
          words.every(word => row.searchText.includes(word))
        : featureVisible(row);
    return this.groups
      .filter(group => room === ALL_ROOMS || room === SELECTED_ONLY || group.key === room)
      .map(group => ({
        ...group,
        devices: group.devices
          .map(entry => ({
            ...entry,
            features: entry.features.filter(featureVisible),
            rows: entry.rows.filter(rowVisible)
          }))
          .filter(entry => entry.rows.length > 0)
      }))
      .filter(group => group.devices.length > 0);
  }

  // Suggestions (props.suggestions, selectors): rows above the list, shown on the full list only —
  // a search or a room filter is the user looking for something else
  getSuggestionRows() {
    const { search, room } = this.state;
    if (!this.props.suggestions || this.props.single || search || room !== ALL_ROOMS) {
      return [];
    }
    const rows = [];
    const seen = new Set();
    this.props.suggestions.forEach(selector => {
      const located = this.rowBySelector.get(selector);
      if (!located || seen.has(located.row.key) || rows.length >= MAX_SUGGESTION_ROWS) {
        return;
      }
      seen.add(located.row.key);
      rows.push(located);
    });
    return rows;
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

  // "On · 72%": what a light is doing, under its name
  getLightSummary(features) {
    const dictionary = get(this.props, 'intl.dictionary');
    const lightFeatures = features.map(entry => entry.feature);
    const binary = getLightFeature(lightFeatures, DEVICE_FEATURE_TYPES.LIGHT.BINARY);
    const brightness = getLightFeature(lightFeatures, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS);
    const parts = [];
    if (hasValue(binary)) {
      parts.push(get(dictionary, binary.last_value ? 'deviceFeatureValueText.on' : 'deviceFeatureValueText.off'));
    }
    if (hasValue(brightness) && (!binary || binary.last_value)) {
      parts.push(`${valueToPercent(brightness, brightness.last_value)} %`);
    }
    return parts.filter(Boolean).join(' · ');
  }

  renderFeatureRow(props, { feature, description, selector }, options = {}) {
    const { selected } = this.state;
    return (
      <label
        class={cx(style.feature, {
          [style.featureAlone]: props.pickDevices,
          [style.featureNested]: options.nested
        })}
        key={`${options.prefix || ''}${selector}`}
        data-cy={`${options.prefix || 'picker-feature-'}${selector}`}
      >
        <input
          type={props.single ? 'radio' : 'checkbox'}
          class={style.checkbox}
          checked={selected.includes(selector)}
          onClick={props.single ? event => this.toggleFeature(selector, event) : undefined}
          onChange={props.single ? undefined : event => this.toggleFeature(selector, event)}
        />
        <span class={cx(style.tick, { [style.tickRadio]: props.single })} aria-hidden="true">
          <i class="fe fe-check" />
        </span>
        <span class={style.featureIcon} aria-hidden="true">
          <i class={`fe fe-${getFeatureIcon(feature, props.defaultIcon)}`} />
        </span>
        <span class={style.featureName}>
          {options.name || description}
          {options.sub && <small class={style.featureSub}>{options.sub}</small>}
        </span>
        {/* a device row only shows a value it has: "No value" on every camera or
            speaker is noise */}
        {(!props.pickDevices || hasValue(feature)) && (
          <span class={style.featureValue}>
            <DeviceFeatureValueText feature={feature} />
          </span>
        )}
      </label>
    );
  }

  // One row for a whole light, which opens on its features
  renderLightRow(props, row, options = {}) {
    const { selected, expandedLights } = this.state;
    const count = row.selectors.filter(selector => selected.includes(selector)).length;
    const all = count === row.selectors.length;
    const partial = count > 0 && !all;
    const expanded = !options.suggestion && expandedLights.includes(row.key);
    const color = getLightCssColor(row.features.map(entry => entry.feature));
    const summary = this.getLightSummary(row.features);
    const name = options.name || row.device.name;
    return (
      <div key={`${options.prefix || ''}${row.key}`}>
        <div class={cx(style.lightRow, { [style.lightRowAlone]: options.alone })}>
          <label
            class={cx(style.feature, style.lightLabel)}
            data-cy={`${options.prefix || 'picker-light-'}${row.device.selector}`}
          >
            <input
              type="checkbox"
              class={style.checkbox}
              checked={all}
              ref={element => {
                // a light partly in the widget: neither ticked nor empty
                if (element) {
                  element.indeterminate = partial;
                }
              }}
              onChange={() => this.toggleSelectors(row.selectors)}
            />
            <span class={cx(style.tick, { [style.tickPartial]: partial })} aria-hidden="true">
              <i class={cx('fe', partial ? 'fe-minus' : 'fe-check')} />
            </span>
            <span class={style.featureIcon} aria-hidden="true">
              <i class="fe fe-sun" />
            </span>
            <span class={style.featureName}>
              {name}
              <small class={style.featureSub}>
                {/* the color the lamp shows, as a dot: a warm white tinting the icon was invisible */}
                {color && <span class={style.lightColorDot} style={{ backgroundColor: color }} aria-hidden="true" />}
                {[options.sub, summary].filter(Boolean).join(' · ')}
              </small>
            </span>
          </label>
          {!options.suggestion && (
            <Localizer>
              <button
                type="button"
                class={style.expandButton}
                aria-expanded={expanded ? 'true' : 'false'}
                aria-label={<Text id="deviceFeaturePicker.lightDetails" fields={{ name: row.device.name }} />}
                onClick={() => this.toggleExpanded(row.key)}
                data-cy={`picker-light-expand-${row.device.selector}`}
              >
                <span>{row.selectors.length}</span>
                <i class={cx('fe', expanded ? 'fe-chevron-up' : 'fe-chevron-down')} aria-hidden="true" />
              </button>
            </Localizer>
          )}
        </div>
        {expanded && row.features.map(entry => this.renderFeatureRow(props, entry, { nested: true }))}
      </div>
    );
  }

  renderSuggestions(props, suggestionRows) {
    if (suggestionRows.length === 0) {
      return null;
    }
    return (
      <div class={style.suggestions} data-cy="picker-suggestions">
        <div class={style.roomHeading}>
          <Text id="deviceFeaturePicker.suggestions" />
        </div>
        <div class={style.device}>
          {suggestionRows.map(({ row, device, room }) =>
            row.kind === 'light'
              ? this.renderLightRow(props, row, {
                  suggestion: true,
                  prefix: 'picker-suggestion-light-',
                  sub: room.name
                })
              : this.renderFeatureRow(props, row, {
                  prefix: 'picker-suggestion-',
                  name: device.name,
                  sub: [room.name, row.description].filter(Boolean).join(' · ')
                })
          )}
        </div>
      </div>
    );
  }

  render(props, { selected, search, room }) {
    const initial = props.selected || [];
    // counted in rows, as the widget shows them: a light is one, whatever number of features it
    // groups
    const addedCount = this.countRows(selected.filter(selector => !initial.includes(selector)));
    const removedCount = this.countRows(initial.filter(selector => !selected.includes(selector)));
    const visibleGroups = this.getVisibleGroups();
    const suggestionRows = this.getSuggestionRows();
    const selectedRowsByRoom = {};
    this.groups.forEach(group => {
      selectedRowsByRoom[group.key] = new Set();
    });
    selected.forEach(selector => {
      const located = this.rowBySelector.get(selector);
      if (located) {
        selectedRowsByRoom[located.room.key].add(located.row.key);
      }
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
            {!props.single &&
              this.renderRoomChip(
                SELECTED_ONLY,
                <Text id="deviceFeaturePicker.selectedFilter" />,
                this.countRows(selected)
              )}
            {this.groups.map(group => this.renderRoomChip(group.key, group.name, selectedRowsByRoom[group.key].size))}
          </div>
        </Localizer>

        {props.sameKindOnly && this.getReferenceFeature(selected) && (
          <p class={style.hint} data-cy="picker-same-kind-hint">
            <Text id="deviceFeaturePicker.sameKindHint" />
          </p>
        )}

        <div class={style.list}>
          {this.renderSuggestions(props, suggestionRows)}
          {visibleGroups.map(group => (
            <div key={group.key}>
              <div class={style.roomHeading}>{group.name}</div>
              {group.devices.map(({ device, rows }) => {
                // a device that is only a light is that light's row: no name above it
                const alone = rows.length === 1 && rows[0].kind === 'light';
                return (
                  <div class={style.device} key={device.selector}>
                    {!props.pickDevices && !alone && <div class={style.deviceName}>{device.name}</div>}
                    {rows.map(row =>
                      row.kind === 'light'
                        ? this.renderLightRow(props, row, {
                            alone,
                            name: alone ? device.name : <Text id="deviceFeaturePicker.lightRow" />
                          })
                        : this.renderFeatureRow(props, row)
                    )}
                  </div>
                );
              })}
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

        {!props.single && this.renderFooter(props, this.countRows(selected), addedCount, removedCount)}
      </div>
    );
  }

  renderFooter(props, selectedCount, addedCount, removedCount) {
    return (
      <div class={style.footer}>
        <span class={style.diff} data-cy="picker-diff">
          {addedCount > 0 && <span class={style.diffAdded}>+{addedCount}</span>}
          {addedCount > 0 && removedCount > 0 && ' · '}
          {removedCount > 0 && <span class={style.diffRemoved}>−{removedCount}</span>}
          {addedCount === 0 && removedCount === 0 && (
            <Text id="deviceFeaturePicker.selectedCount" plural={selectedCount} fields={{ count: selectedCount }} />
          )}
        </span>
        <button type="button" class={style.validateButton} onClick={this.validate} data-cy="picker-validate">
          {props.validateLabel || <Text id="deviceFeaturePicker.validate" />}
        </button>
      </div>
    );
  }
}

export default withIntlAsProp(DeviceFeaturePicker);
