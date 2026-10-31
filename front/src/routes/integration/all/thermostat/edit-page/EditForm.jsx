import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import stickyStyle from '../stickyActions.css';
import { getPresetColor } from '../../../../../utils/thermostatPresetColors';
import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_UNITS,
  PILOT_WIRE_MODE
} from '../../../../../../../server/utils/constants';
import {
  DEFAULT_PILOT_WIRE_ORDERS,
  MAX_WINDOW_DELAY_SECONDS
} from '../../../../../../../server/utils/thermostatConstants';

// The help text of each thermostat type, keyed by its value.
const TYPE_KEYS = { virtual: 'virtual', external: 'external', 'pilot-wire': 'pilotWire' };

// The six orders, warmest last, keyed as the device page already names them.
const PILOT_WIRE_ORDER_OPTIONS = [
  [PILOT_WIRE_MODE.OFF, 'off'],
  [PILOT_WIRE_MODE.FROST_PROTECTION, 'frost-protection'],
  [PILOT_WIRE_MODE.ECO, 'eco'],
  [PILOT_WIRE_MODE.COMFORT_2, 'comfort_-2'],
  [PILOT_WIRE_MODE.COMFORT_1, 'comfort_-1'],
  [PILOT_WIRE_MODE.COMFORT, 'comfort']
];

const FeatureSelect = ({ value, features, onChange, emptyLabel, ariaLabel }) => (
  <select class="form-control" value={value} onChange={onChange} aria-label={ariaLabel}>
    <option value="">{emptyLabel}</option>
    {features &&
      features.map(f => (
        <option key={f.selector} value={f.selector} selected={f.selector === value}>
          {f.label}
        </option>
      ))}
  </select>
);

// Several sensors for one thermostat (spec A.1.1): one select per sensor chosen,
// and a last, empty one to add another. A chosen sensor leaves the lists of the
// others, so the same window cannot be picked twice.
const FeatureListSelect = ({ values, features, onChange, emptyLabel, addLabel, removeLabel }) => {
  const selected = values || [];
  const others = index => (features || []).filter(f => !selected.some((v, i) => i !== index && v === f.selector));
  const replace = (index, selector) => {
    const next = selected.slice();
    if (selector) {
      next[index] = selector;
    } else {
      next.splice(index, 1);
    }
    onChange(next);
  };
  // Each row is named after its sensor, so a screen reader can tell which one a
  // remove button removes.
  const labelOf = selector => {
    const feature = (features || []).find(f => f.selector === selector);
    return feature ? feature.label : selector;
  };
  return (
    <div>
      {selected.map((value, index) => (
        <div class={cx('input-group', style.featureListRow)} key={index}>
          <FeatureSelect
            value={value}
            features={others(index)}
            onChange={e => replace(index, e.target.value)}
            emptyLabel={emptyLabel}
            ariaLabel={labelOf(value)}
          />
          <span class="input-group-append">
            <button
              type="button"
              class="btn btn-outline-secondary"
              title={`${removeLabel} : ${labelOf(value)}`}
              aria-label={`${removeLabel} : ${labelOf(value)}`}
              onClick={() => replace(index, '')}
            >
              <i class="fe fe-x" />
            </button>
          </span>
        </div>
      ))}
      <FeatureSelect
        value=""
        features={others(-1)}
        onChange={e => e.target.value && onChange([...selected, e.target.value])}
        emptyLabel={selected.length === 0 ? emptyLabel : addLabel}
        ariaLabel={addLabel}
      />
    </div>
  );
};

// Rendered by the Save button rather than at the top of the form: it answers a
// press on that button, and the form runs to several screens — at the top it was
// out of sight of the thing that caused it.
const SaveError = ({ status, reason }) =>
  status === RequestStatus.Error && (
    <div class="alert alert-danger">
      {reason === 'incompleteVirtual' && <Text id="integration.thermostat.edit.incompleteVirtualError" />}
      {reason === 'incompleteExternal' && <Text id="integration.thermostat.edit.incompleteExternalError" />}
      {reason === 'incompletePilotWire' && <Text id="integration.thermostat.edit.incompletePilotWireError" />}
      {reason === 'reversibleNoMode' && <Text id="integration.thermostat.edit.reversibleNoModeError" />}
      {reason === 'reversibleModeCannotCool' && <Text id="integration.thermostat.edit.reversibleModeCannotCoolError" />}
      {!reason && <Text id="integration.thermostat.edit.saveError" />}
    </div>
  );

const EditForm = ({ ...props }) => {
  const saving = props.thermostatCreateStatus === RequestStatus.Getting;
  const isEdit = !!(props.thermostatEditDevice && props.thermostatEditDevice.selector);
  // Three types, each with its own settings (spec A.1, C.1.1): a virtual
  // thermostat regulated by Gladys (switch or pilot wire), a real one driven by
  // its setpoint (a connected thermostat, a heat pump…), and a pilot-wire heater
  // regulating itself, which takes an order per preset.
  const thermostatType = ['external', 'pilot-wire'].includes(props.thermostatEditType)
    ? props.thermostatEditType
    : 'virtual';
  const isExternalThermostat = thermostatType === 'external';
  const isPilotWireThermostat = thermostatType === 'pilot-wire';
  const isVirtualThermostat = thermostatType === 'virtual';
  // A pilot-wire heater only heats, on either of its types: cooling is neither
  // offered nor shown.
  const hasPilotWire = isPilotWireThermostat || (isVirtualThermostat && !!props.thermostatEditPilotWireFeature);
  const pickedMode = props.thermostatEditMode || 'heating';
  const mode = hasPilotWire ? 'heating' : pickedMode;
  // The control rules read the other way round in cooling: the switch turns on
  // when the room is too warm. The help texts are therefore per-mode, not a
  // heating text with the word swapped.
  const modeSuffix = mode === 'cooling' ? 'cooling' : 'heating';

  // A schedule belongs to a house, and a thermostat may only follow one of its
  // own house's: the server refuses the rest with DEVICE_NOT_IN_HOUSE. Offering
  // them all showed two indistinguishable "Semaine" entries, and picking the
  // wrong one failed at save time. The room is what places the thermostat in a
  // house, so until one is chosen every schedule stays on offer.
  const selectedHouse = (props.houses || []).find(house =>
    (house.rooms || []).some(room => room.id === props.thermostatEditRoomId)
  );
  // The schedule the thermostat already follows stays on offer even when its room
  // is now in another house: it keeps following it — the house is checked when a
  // link is made, not afterwards — and leaving it out showed "No schedule" on a
  // thermostat following one, with no change left to pick to detach it. It is
  // named with its house, the one thing that sets it apart from this house's.
  const followedSchedule = (props.thermostatEditDevice && props.thermostatEditDeviceSchedule) || '';
  const schedulesOfHouse = selectedHouse
    ? (props.thermostatSchedules || []).filter(
        schedule => schedule.house === selectedHouse.selector || schedule.selector === followedSchedule
      )
    : props.thermostatSchedules || [];
  const scheduleLabel = schedule => {
    if (!selectedHouse || schedule.house === selectedHouse.selector) {
      return schedule.name;
    }
    const house = (props.houses || []).find(candidate => candidate.selector === schedule.house);
    return house ? `${schedule.name} (${house.name})` : schedule.name;
  };

  // The pickers start from the thermostat's room (spec A.3): a house has hundreds
  // of features, and choosing the salon's sensor meant scrolling past every other
  // room's. A switch widens them all at once — an open-plan salon and kitchen
  // heated as one, a heat pump whose device sits in another room. A feature
  // already chosen stays listed whatever its room, or opening the form would
  // silently blank it. Such a feature keeps its room in its label, so it cannot
  // be mistaken for one of this room's.
  const roomId = props.thermostatEditRoomId || '';
  const narrowed = Boolean(roomId) && !props.thermostatEditShowAllRooms;
  const roomNames = {};
  (props.houses || []).forEach(house => (house.rooms || []).forEach(room => (roomNames[room.id] = room.name)));
  const pickable = (features, kept) =>
    (features || [])
      .filter(feature => !narrowed || feature.roomId === roomId || kept.includes(feature.selector))
      .map(feature =>
        (!narrowed || feature.roomId !== roomId) && roomNames[feature.roomId]
          ? { ...feature, label: `${roomNames[feature.roomId]} - ${feature.label}` }
          : feature
      );
  const keep = value => (value ? [value] : []);

  // A reversible heat pump (spec A.4): only a real thermostat, which has a mode
  // to write. A virtual one drives a single relay, and a pilot wire only heats.
  const reversible = Boolean(props.thermostatEditReversible) && isExternalThermostat;
  const heatingPresets = ['frost', 'away', 'eco', 'night', 'comfort'];
  const coolingPresets = ['comfort'];
  // One programme in both uses: every preset it names needs a cooling setpoint.
  const activePresets = mode === 'cooling' && !reversible ? coolingPresets : heatingPresets;

  const presetFields = {
    frost: 'thermostatEditPresetFrost',
    away: 'thermostatEditPresetAway',
    eco: 'thermostatEditPresetEco',
    night: 'thermostatEditPresetNight',
    comfort: 'thermostatEditPresetComfort'
  };
  const coolingPresetFields = {
    frost: 'thermostatEditPresetCoolingFrost',
    away: 'thermostatEditPresetCoolingAway',
    eco: 'thermostatEditPresetCoolingEco',
    night: 'thermostatEditPresetCoolingNight',
    comfort: 'thermostatEditPresetCoolingComfort'
  };

  // The setpoint of one preset, in the form's unit.
  const presetTempInput = field => (
    <div class={cx('input-group', 'input-group-sm', style.presetTempGroup)}>
      <input
        type="number"
        class={`form-control ${style.presetTempInput}`}
        value={props[field]}
        onInput={e => props.updateThermostatField(field, e.target.value)}
        step="0.5"
      />
      <div class="input-group-append">
        <span class="input-group-text">{(props.thermostatEditTempUnit || 'C') === 'F' ? '°F' : '°C'}</span>
      </div>
    </div>
  );

  // A pilot wire is regulated on hysteresis only (spec C.1.1): TPI is neither
  // offered nor shown while one is picked.
  const pickedControlType = props.thermostatEditControlType || 'hysteresis';
  const controlType = hasPilotWire && pickedControlType === 'tpi' ? 'hysteresis' : pickedControlType;
  // A real thermostat runs its own heuristic and drives its own heater: Gladys
  // only writes the setpoint its schedule resolves. Hysteresis, TPI and the
  // switch are therefore hidden — offering them would suggest Gladys regulates
  // a device that regulates itself.
  const switchChoices = pickable(props.switchFeatures, keep(props.thermostatEditSwitchFeature));
  const pilotWireChoices = pickable(props.pilotWireFeatures, keep(props.thermostatEditPilotWireFeature));
  // A pilot-wire heater regulating itself takes no temperature: each preset
  // sends an order instead.
  const presetsAreOrders = isPilotWireThermostat;
  const pilotWireOrders = props.thermostatEditPilotWireOrders || DEFAULT_PILOT_WIRE_ORDERS;
  // A module that declares the orders it takes is only offered those: a
  // 4-order one refuses comfort -1 and -2. The order a preset already sends
  // stays listed, so the select never shows another one.
  const pickedPilotWire = (props.pilotWireFeatures || []).find(
    feature => feature.selector === props.thermostatEditPilotWireFeature
  );
  const supportedOrders =
    pickedPilotWire && pickedPilotWire.supportedOrders && pickedPilotWire.supportedOrders.length > 0
      ? pickedPilotWire.supportedOrders
      : null;
  const orderOptionsFor = key =>
    PILOT_WIRE_ORDER_OPTIONS.filter(
      ([value]) => !supportedOrders || supportedOrders.includes(value) || value === pilotWireOrders[key]
    );

  // The pilot-wire picker: in the heating section of a virtual thermostat, next
  // to the switch, and first thing on a pilot-wire one.
  const pilotWirePicker = (
    <div class="form-group">
      <label class="form-label">
        <Text id="integration.thermostat.edit.pilotWireFeatureLabel" />
      </label>
      <Localizer>
        <FeatureSelect
          value={props.thermostatEditPilotWireFeature || ''}
          features={pilotWireChoices}
          onChange={e => props.updateThermostatActuator('thermostatEditPilotWireFeature', e.target.value)}
          emptyLabel={<Text id="global.emptySelectOption" />}
        />
      </Localizer>
      <small class="form-text text-muted">
        <Text id="integration.thermostat.edit.pilotWireFeatureHelp" />{' '}
        <Text
          id={`integration.thermostat.edit.pilotWireRegulationHelp.${isPilotWireThermostat ? 'heater' : 'gladys'}`}
        />
      </small>
      {/* Promised by the spec (G): a module that keeps its own programme
          writes orders that are taken as presses of its button, and Gladys
          and the programme take turns. */}
      {props.thermostatEditPilotWireFeature && (
        <div class={cx('alert', 'alert-warning', 'mt-2', style.vendorWarning)}>
          <Text id="integration.thermostat.edit.pilotWireProgrammeWarning" />
        </div>
      )}
    </div>
  );

  // Picking the real thermostat's setpoint feature adopts the range it
  // advertises. A Netatmo says 5-30, and the 5-35 default then offered the user
  // two degrees the device would refuse or silently clamp. Only the untouched
  // defaults are replaced: a range the user has already narrowed is theirs.
  // The range the chosen real thermostat advertises, when it declares one in the
  // unit this form is in. Adopting it automatically covers the common path, but
  // only while the bounds are still untouched: this hint covers the rest — a
  // thermostat edited later, a setpoint picked before the unit was set, a range
  // the user changed and wants back.
  const pickedTarget = isExternalThermostat
    ? (props.targetFeatures || []).find(feature => feature.selector === props.thermostatEditTargetFeature)
    : null;
  // An air conditioner's mode has no Off: without its power, nothing stops it
  // (spec A.0.3). The field stays optional for a thermostat, which a mode stops.
  const needsPower =
    !!pickedTarget &&
    pickedTarget.category === DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING &&
    !props.thermostatEditPowerFeature;
  const formUnit = props.thermostatEditTempUnit || 'C';
  const targetRange =
    pickedTarget &&
    pickedTarget.min !== null &&
    pickedTarget.min !== undefined &&
    pickedTarget.max !== null &&
    pickedTarget.max !== undefined &&
    (!pickedTarget.unit || (pickedTarget.unit === DEVICE_FEATURE_UNITS.FAHRENHEIT ? 'F' : 'C') === formUnit)
      ? { min: String(pickedTarget.min), max: String(pickedTarget.max) }
      : null;
  // Shown only when the form does not already say the same thing.
  const rangeDiffers =
    targetRange &&
    (targetRange.min !== String(props.thermostatEditMinTemp) ||
      targetRange.max !== String(props.thermostatEditMaxTemp));
  const applyDeviceRange = () => {
    props.updateThermostatField('thermostatEditMinTemp', targetRange.min);
    props.updateThermostatField('thermostatEditMaxTemp', targetRange.max);
  };

  const chooseTargetFeature = event => {
    const selector = event.target.value;
    const previous = (props.targetFeatures || []).find(
      feature => feature.selector === props.thermostatEditTargetFeature
    );
    props.updateThermostatField('thermostatEditTargetFeature', selector);
    const picked = (props.targetFeatures || []).find(feature => feature.selector === selector);
    // The mode and power belong to the unit whose setpoint was picked: moving to
    // another unit drops those of the previous one, or every pass would keep
    // switching a unit the thermostat no longer drives.
    let modeFeature = props.thermostatEditModeFeature;
    let powerFeature = props.thermostatEditPowerFeature;
    if (previous && (!picked || picked.deviceSelector !== previous.deviceSelector)) {
      const ofPrevious = (features, value) =>
        (features || []).some(
          feature => feature.selector === value && feature.deviceSelector === previous.deviceSelector
        );
      if (ofPrevious(props.modeFeatures, modeFeature)) {
        modeFeature = '';
        props.updateThermostatField('thermostatEditModeFeature', '');
      }
      if (ofPrevious(props.powerFeatures, powerFeature)) {
        powerFeature = '';
        props.updateThermostatField('thermostatEditPowerFeature', '');
      }
    }
    if (!picked) {
      return;
    }
    // An air conditioner has one mode and one power, on the same device as its
    // setpoint: they are suggested when the fields are still empty (spec A.0.3).
    // Without the power, a heat pump can only be "stopped" by a setpoint it
    // clamps to its own minimum and keeps heating to.
    if (picked.category === DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING) {
      const sameUnit = features =>
        (features || []).find(
          feature =>
            feature.deviceSelector === picked.deviceSelector &&
            feature.category === DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING
        );
      const unitMode = sameUnit(props.modeFeatures);
      const unitPower = sameUnit(props.powerFeatures);
      if (unitMode && !modeFeature) {
        props.updateThermostatField('thermostatEditModeFeature', unitMode.selector);
      }
      if (unitPower && !powerFeature) {
        props.updateThermostatField('thermostatEditPowerFeature', unitPower.selector);
      }
    }
    // Only when the device reports in the unit this form is in: a Fahrenheit
    // feature's 41-86 written into a Celsius field would read as a range no house
    // ever heats to.
    const featureUnit = picked.unit === DEVICE_FEATURE_UNITS.FAHRENHEIT ? 'F' : 'C';
    if (picked.unit && featureUnit !== (props.thermostatEditTempUnit || 'C')) {
      return;
    }
    const defaults = { thermostatEditMinTemp: '5', thermostatEditMaxTemp: '35' };
    if (
      picked.min !== null &&
      picked.min !== undefined &&
      props.thermostatEditMinTemp === defaults.thermostatEditMinTemp
    ) {
      props.updateThermostatField('thermostatEditMinTemp', String(picked.min));
    }
    if (
      picked.max !== null &&
      picked.max !== undefined &&
      props.thermostatEditMaxTemp === defaults.thermostatEditMaxTemp
    ) {
      props.updateThermostatField('thermostatEditMaxTemp', String(picked.max));
    }
  };

  return (
    <div class="card">
      <div class="card-header">
        <h1 class="card-title">
          {isEdit ? (
            <Text id="integration.thermostat.edit.titleEdit" />
          ) : (
            <Text id="integration.thermostat.edit.titleNew" />
          )}
        </h1>
      </div>
      <div class="card-body">
        <div class={cx('dimmer', { active: saving })}>
          <div class="loader" />
          <div class="dimmer-content">
            {/* Three sections rather than one run of fifteen fields: what the
                appliance is, how it heats, and when. A single block buried
                "Active schedule" — the setting that makes the feature work — in
                next-to-last place, after the min/max temperatures. */}
            <h4 class={style.formSection}>
              <Text id="integration.thermostat.edit.sectionDevice" />
            </h4>

            {/* Nom */}
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.thermostat.edit.nameLabel" />
              </label>
              <Localizer>
                <input
                  type="text"
                  class="form-control"
                  placeholder={<Text id="integration.thermostat.edit.namePlaceholder" />}
                  value={props.thermostatEditName}
                  onInput={e => props.updateThermostatField('thermostatEditName', e.target.value)}
                />
              </Localizer>
            </div>

            {/* Pièce */}
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.thermostat.edit.roomLabel" />
              </label>
              <select
                class="form-control"
                value={props.thermostatEditRoomId || ''}
                onChange={e => props.updateThermostatField('thermostatEditRoomId', e.target.value)}
              >
                <option value="">
                  <Text id="global.emptySelectOption" />
                </option>
                {props.houses &&
                  props.houses.map(house => (
                    <optgroup label={house.name}>
                      {house.rooms.map(room => (
                        <option selected={room.id === props.thermostatEditRoomId} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
              </select>
              {roomId && (
                <label class={cx('custom-switch', style.showAllRooms)}>
                  <input
                    type="checkbox"
                    class="custom-switch-input"
                    checked={!!props.thermostatEditShowAllRooms}
                    onChange={e => props.updateThermostatField('thermostatEditShowAllRooms', e.target.checked)}
                  />
                  <span class="custom-switch-indicator" />
                  <span class="custom-switch-description">
                    <Text id="integration.thermostat.edit.showAllRoomsLabel" />
                  </span>
                </label>
              )}
              {roomId && (
                <small class="form-text text-muted">
                  <Text id="integration.thermostat.edit.showAllRoomsHelp" />
                </small>
              )}
            </div>

            {/* Type de thermostat */}
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.thermostat.edit.typeLabel" />
              </label>
              <select
                class="form-control"
                value={thermostatType}
                onChange={e => props.updateThermostatType(e.target.value)}
              >
                <option value="virtual">
                  <Text id="integration.thermostat.edit.typeVirtual" />
                </option>
                <option value="external">
                  <Text id="integration.thermostat.edit.typeExternal" />
                </option>
                <option value="pilot-wire">
                  <Text id="integration.thermostat.edit.typePilotWire" />
                </option>
              </select>
              <small class="form-text text-muted">
                <Text id={`integration.thermostat.edit.typeHelp.${TYPE_KEYS[thermostatType]}`} />
              </small>
            </div>

            {/* Usage: what this thermostat drives. Directly under the type,
                and no longer called "Mode": it used to sit right after the
                device's own "Operating mode (optional)", and two fields named
                Mode in a row read as the same question asked twice. A
                pilot-wire heater regulating itself only heats: there is no
                question to ask, and it is saved as heating. */}
            {!isPilotWireThermostat && (
              <div class="form-group">
                <label class="form-label">
                  <Text id="integration.thermostat.edit.modeLabel" />
                </label>
                <select
                  class="form-control"
                  value={mode}
                  onChange={e => {
                    props.updateThermostatMode(e.target.value);
                    // TPI is heating-only: switching to cooling falls back to hysteresis
                    if (e.target.value === 'cooling' && controlType === 'tpi') {
                      props.updateThermostatField('thermostatEditControlType', 'hysteresis');
                    }
                  }}
                >
                  <option value="heating">
                    <Text id="integration.thermostat.edit.mode.heating" />
                  </option>
                  {!hasPilotWire && (
                    <option value="cooling">
                      <Text id="integration.thermostat.edit.mode.cooling" />
                    </option>
                  )}
                </select>
                <small class="form-text text-muted">
                  <Text id="integration.thermostat.edit.modeHelp" />
                </small>
                {/* One thermostat for both seasons (spec A.4): the use above is
                    then the one in force, switched from the widget, a scene or
                    the unit's remote. */}
                {isExternalThermostat && (
                  <label class="custom-switch mt-2">
                    <input
                      type="checkbox"
                      class="custom-switch-input"
                      checked={reversible}
                      onChange={e => props.updateThermostatReversible(e.target.checked)}
                    />
                    <span class="custom-switch-indicator" />
                    <span class="custom-switch-description">
                      <Text id="integration.thermostat.edit.reversibleLabel" />
                    </span>
                  </label>
                )}
                {reversible && (
                  <small class="form-text text-muted">
                    <Text id="integration.thermostat.edit.reversibleHelp" />
                  </small>
                )}
              </div>
            )}

            {/* Radiateur à fil pilote qui régule seul : piloté par un ordre. */}
            {isPilotWireThermostat && pilotWirePicker}

            {/* Thermostat réel piloté par sa consigne */}
            {isExternalThermostat && (
              <div>
                {/* Promised by the spec (G) and owed to the user: while the
                    appliance keeps its own programme, that programme and Gladys
                    both write the setpoint, and the thermostat follows whichever
                    wrote last. First thing in this section, before the setpoint
                    it is about to drive. */}
                <div class={cx('alert', 'alert-warning', style.vendorWarning)}>
                  <Text id="integration.thermostat.edit.vendorProgrammeWarning" />
                </div>

                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.thermostat.edit.targetFeatureLabel" />
                  </label>
                  <Localizer>
                    <FeatureSelect
                      value={props.thermostatEditTargetFeature || ''}
                      features={pickable(props.targetFeatures, keep(props.thermostatEditTargetFeature))}
                      onChange={chooseTargetFeature}
                      emptyLabel={<Text id="global.emptySelectOption" />}
                    />
                  </Localizer>
                  <small class="form-text text-muted">
                    <Text id="integration.thermostat.edit.targetFeatureHelp" />
                  </small>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.thermostat.edit.stateFeatureLabel" />
                  </label>
                  <Localizer>
                    <FeatureSelect
                      value={props.thermostatEditStateFeature || ''}
                      features={pickable(props.stateFeatures, keep(props.thermostatEditStateFeature))}
                      onChange={e => props.updateThermostatField('thermostatEditStateFeature', e.target.value)}
                      emptyLabel={<Text id="global.emptySelectOption" />}
                    />
                  </Localizer>
                  <small class="form-text text-muted">
                    <Text id="integration.thermostat.edit.stateFeatureHelp" />
                  </small>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.thermostat.edit.modeFeatureLabel" />
                  </label>
                  <Localizer>
                    <FeatureSelect
                      value={props.thermostatEditModeFeature || ''}
                      features={pickable(props.modeFeatures, keep(props.thermostatEditModeFeature))}
                      onChange={e => props.updateThermostatField('thermostatEditModeFeature', e.target.value)}
                      emptyLabel={<Text id="global.emptySelectOption" />}
                    />
                  </Localizer>
                  <small class="form-text text-muted">
                    <Text id="integration.thermostat.edit.modeFeatureHelp" />
                  </small>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.thermostat.edit.powerFeatureLabel" />
                  </label>
                  <Localizer>
                    <FeatureSelect
                      value={props.thermostatEditPowerFeature || ''}
                      features={pickable(props.powerFeatures, keep(props.thermostatEditPowerFeature))}
                      onChange={e => props.updateThermostatField('thermostatEditPowerFeature', e.target.value)}
                      emptyLabel={<Text id="global.emptySelectOption" />}
                    />
                  </Localizer>
                  {needsPower && (
                    <div class="alert alert-warning mt-2 mb-0">
                      <Text id="integration.thermostat.edit.powerFeatureNeeded" />
                    </div>
                  )}
                  <small class="form-text text-muted">
                    <Text id="integration.thermostat.edit.powerFeatureHelp" />
                  </small>
                </div>
              </div>
            )}

            <h4 class={style.formSection}>
              <Text id={`integration.thermostat.edit.section.${modeSuffix}`} />
            </h4>

            {/* Capteur de température */}
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.thermostat.edit.temperatureFeatureLabel" />
              </label>
              <Localizer>
                <FeatureListSelect
                  values={props.thermostatEditTemperatureFeatures}
                  features={pickable(props.temperatureFeatures, props.thermostatEditTemperatureFeatures || [])}
                  onChange={values => props.updateThermostatField('thermostatEditTemperatureFeatures', values)}
                  emptyLabel={<Text id="global.emptySelectOption" />}
                  addLabel={<Text id="integration.thermostat.edit.addTemperatureFeature" />}
                  removeLabel={<Text id="integration.thermostat.edit.removeFeature" />}
                />
              </Localizer>
              <small class="form-text text-muted">
                <Text id="integration.thermostat.edit.temperatureFeatureHelp" />
              </small>
            </div>

            {/* Capteur d'humidité */}
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.thermostat.edit.humidityFeatureLabel" />
              </label>
              <Localizer>
                <FeatureSelect
                  value={props.thermostatEditHumidityFeature || ''}
                  features={pickable(props.humidityFeatures, keep(props.thermostatEditHumidityFeature))}
                  onChange={e => props.updateThermostatField('thermostatEditHumidityFeature', e.target.value)}
                  emptyLabel={<Text id="global.emptySelectOption" />}
                />
              </Localizer>
              <small class="form-text text-muted">
                <Text id="integration.thermostat.edit.humidityFeatureHelp" />
              </small>
            </div>

            {/* Commutateur : seul un thermostat virtuel pilote un interrupteur. */}
            {isVirtualThermostat && (
              <div class="form-group">
                <label class="form-label">
                  <Text id="integration.thermostat.edit.switchFeatureLabel" />
                </label>
                <Localizer>
                  <FeatureSelect
                    value={props.thermostatEditSwitchFeature || ''}
                    features={switchChoices}
                    onChange={e => props.updateThermostatActuator('thermostatEditSwitchFeature', e.target.value)}
                    emptyLabel={<Text id="global.emptySelectOption" />}
                  />
                </Localizer>
                {/* A pilot wire on offer is the other actuator, picked just below:
                    sending the user to the real-thermostat type would mislead. */}
                {switchChoices.length === 0 && pilotWireChoices.length === 0 && (
                  <div class="alert alert-info mt-2 mb-0">
                    <Text id={`integration.thermostat.edit.noSwitchHint.${modeSuffix}`} />
                  </div>
                )}
                <small class="form-text text-muted">
                  <Text id={`integration.thermostat.edit.switchFeatureHelp.${modeSuffix}`} />
                </small>
              </div>
            )}

            {/* Fil pilote : l'autre façon de piloter un radiateur, par un ordre
                sur son fil de commande plutôt que par une coupure. Gladys le
                régule alors sur le capteur d'ambiance. */}
            {isVirtualThermostat && pilotWirePicker}

            {/* Capteur d'ouverture de fenêtre */}
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.thermostat.edit.windowFeatureLabel" />
              </label>
              <Localizer>
                <FeatureListSelect
                  values={props.thermostatEditWindowFeatures}
                  features={pickable(props.openingFeatures, props.thermostatEditWindowFeatures || [])}
                  onChange={values => props.updateThermostatField('thermostatEditWindowFeatures', values)}
                  emptyLabel={<Text id="global.emptySelectOption" />}
                  addLabel={<Text id="integration.thermostat.edit.addWindowFeature" />}
                  removeLabel={<Text id="integration.thermostat.edit.removeFeature" />}
                />
              </Localizer>
              <small class="form-text text-muted">
                <Text id={`integration.thermostat.edit.windowFeatureHelp.${modeSuffix}`} />
              </small>
            </div>

            {/* How long the sensor has to stay open before the heating is
                suspended: a door opened to come in and closed right behind
                should not cut it. Pointless without a sensor. */}
            {(props.thermostatEditWindowFeatures || []).length > 0 && (
              <div class="form-group">
                <label class="form-label">
                  <Text id="integration.thermostat.edit.windowDelayLabel" />
                </label>
                <div class={cx('input-group', style.shortNumberField)}>
                  <input
                    type="number"
                    class="form-control"
                    min="0"
                    max={MAX_WINDOW_DELAY_SECONDS}
                    step="1"
                    value={props.thermostatEditWindowDelay}
                    onInput={e => props.updateThermostatField('thermostatEditWindowDelay', e.target.value)}
                  />
                  <div class="input-group-append">
                    <span class="input-group-text">
                      <Text id="integration.thermostat.edit.windowDelayUnit" />
                    </span>
                  </div>
                </div>
                <small class="form-text text-muted">
                  <Text id={`integration.thermostat.edit.windowDelayHelp.${modeSuffix}`} />
                </small>
              </div>
            )}

            {/* Folded away: the control type and its hysteresis or TPI figures
                all have working defaults, and putting them ahead of the sensor
                and the actuator buried the two fields that decide whether the
                thermostat regulates at all. A real thermostat runs its own
                heuristic, so none of this applies to it — nor to a pilot-wire
                heater left to regulate on its own.

                The unit and the bounds stay out of the fold below: they are the
                thermostat's own, external ones included. */}
            {isVirtualThermostat && (
              <details class={cx('mb-3', style.tuningDetails)}>
                {/* With a chevron: styled as a form-label alone, the summary
                    looked like a plain heading and nothing said it opened. */}
                <summary class={cx('form-label', style.tuningSummary)}>
                  <i class={`fe fe-chevron-right ${style.tuningChevron}`} aria-hidden="true" />
                  <Text id="integration.thermostat.edit.tuningSection" />
                </summary>
                <div>
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="integration.thermostat.edit.controlTypeLabel" />
                    </label>
                    <select
                      class="form-control"
                      value={controlType}
                      onChange={e => props.updateThermostatField('thermostatEditControlType', e.target.value)}
                    >
                      <option value="hysteresis">
                        <Text id="integration.thermostat.edit.controlType.hysteresis" />
                      </option>
                      {/* TPI modulates the on-time over a cycle, which only makes sense
                    for heating: a compressor cannot be pulsed that way */}
                      {mode !== 'cooling' && !hasPilotWire && (
                        <option value="tpi">
                          <Text id="integration.thermostat.edit.controlType.tpi" />
                        </option>
                      )}
                    </select>
                    <small class="form-text text-muted">
                      {controlType === 'tpi' ? (
                        <span>
                          <strong>
                            <Text id="integration.thermostat.edit.controlType.tpi" />
                          </strong>
                          {' — '}
                          <Text id="integration.thermostat.edit.tpiExplain" />
                        </span>
                      ) : (
                        <span>
                          <strong>
                            <Text id="integration.thermostat.edit.controlType.hysteresis" />
                          </strong>
                          {' — '}
                          <Text id={`integration.thermostat.edit.hysteresisExplain.${modeSuffix}`} />
                        </span>
                      )}
                    </small>
                  </div>

                  {/* Paramètres hystérésis */}
                  {controlType === 'hysteresis' && (
                    <div class="row">
                      <div class="col-md-6">
                        <div class="form-group">
                          <label class="form-label">
                            <Text id="integration.thermostat.edit.hysteresisStartLabel" />
                          </label>
                          <div class="input-group">
                            <input
                              type="number"
                              class="form-control"
                              step="0.1"
                              min="0"
                              max="5"
                              value={props.thermostatEditHysteresisStart || '0.5'}
                              onInput={e =>
                                props.updateThermostatField('thermostatEditHysteresisStart', e.target.value)
                              }
                            />
                            <div class="input-group-append">
                              <span class="input-group-text">
                                {(props.thermostatEditTempUnit || 'C') === 'F' ? '°F' : '°C'}
                              </span>
                            </div>
                          </div>
                          <small class="form-text text-muted">
                            <Text id={`integration.thermostat.edit.hysteresisStartHelp.${modeSuffix}`} />
                          </small>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="form-group">
                          <label class="form-label">
                            <Text id="integration.thermostat.edit.hysteresisStopLabel" />
                          </label>
                          <div class="input-group">
                            <input
                              type="number"
                              class="form-control"
                              step="0.1"
                              min="0"
                              max="5"
                              value={props.thermostatEditHysteresisStop || '0.5'}
                              onInput={e => props.updateThermostatField('thermostatEditHysteresisStop', e.target.value)}
                            />
                            <div class="input-group-append">
                              <span class="input-group-text">
                                {(props.thermostatEditTempUnit || 'C') === 'F' ? '°F' : '°C'}
                              </span>
                            </div>
                          </div>
                          <small class="form-text text-muted">
                            <Text id={`integration.thermostat.edit.hysteresisStopHelp.${modeSuffix}`} />
                          </small>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Paramètres TPI */}
                  {controlType === 'tpi' && (
                    <div class="row">
                      <div class="col-md-6">
                        <div class="form-group">
                          <label class="form-label">
                            <Text id="integration.thermostat.edit.tpiCycleTimeLabel" />
                          </label>
                          <div class="input-group">
                            <input
                              type="number"
                              class="form-control"
                              step="1"
                              min="5"
                              max="120"
                              value={props.thermostatEditTpiCycleTime || '30'}
                              onInput={e => props.updateThermostatField('thermostatEditTpiCycleTime', e.target.value)}
                            />
                            <div class="input-group-append">
                              <span class="input-group-text">min</span>
                            </div>
                          </div>
                          <small class="form-text text-muted">
                            <Text id="integration.thermostat.edit.tpiCycleTimeHelp" />
                          </small>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="form-group">
                          <label class="form-label">
                            <Text id="integration.thermostat.edit.tpiProportionalBandLabel" />
                          </label>
                          <div class="input-group">
                            <input
                              type="number"
                              class="form-control"
                              step="0.5"
                              min="0.5"
                              max="10"
                              value={props.thermostatEditTpiProportionalBand || '2'}
                              onInput={e =>
                                props.updateThermostatField('thermostatEditTpiProportionalBand', e.target.value)
                              }
                            />
                            <div class="input-group-append">
                              <span class="input-group-text">
                                {(props.thermostatEditTempUnit || 'C') === 'F' ? '°F' : '°C'}
                              </span>
                            </div>
                          </div>
                          <small class="form-text text-muted">
                            <Text id="integration.thermostat.edit.tpiProportionalBandHelp" />
                          </small>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Unité : elle décide comment lire tous les autres champs, donc elle
                reste visible. */}
            <div class="row">
              <div class="col-md-4">
                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.thermostat.edit.tempUnitLabel" />
                  </label>
                  <select
                    class="form-control"
                    value={props.thermostatEditTempUnit}
                    onChange={e => props.updateThermostatUnit(e.target.value)}
                  >
                    <option value="C">
                      <Text id="integration.thermostat.edit.celsius" />
                    </option>
                    <option value="F">
                      <Text id="integration.thermostat.edit.fahrenheit" />
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Folded: the bounds have working defaults, and on a real thermostat
                they are adopted from the range the device advertises. The form ran
                about three and a half screens before Save on a phone, and these are
                the two fields least often touched. The unit stays out of the fold:
                it decides how every other temperature on the page reads. */}
            {/* A heater regulating itself takes no setpoint: there is nothing
                for the bounds to bound. */}
            {!isPilotWireThermostat && (
              <details class={cx('mb-3', style.tuningDetails)}>
                <summary class={cx('form-label', style.tuningSummary)}>
                  <i class={`fe fe-chevron-right ${style.tuningChevron}`} aria-hidden="true" />
                  <Text id="integration.thermostat.edit.rangeSection" />
                </summary>
                <div class="row">
                  <div class="col-md-6">
                    <div class="form-group">
                      <label class="form-label">
                        <Text id="integration.thermostat.edit.minTempLabel" />
                      </label>
                      <div class="input-group">
                        <Localizer>
                          <input
                            type="number"
                            class="form-control"
                            placeholder={<Text id="integration.thermostat.edit.minTempPlaceholder" />}
                            value={props.thermostatEditMinTemp}
                            onInput={e => props.updateThermostatField('thermostatEditMinTemp', e.target.value)}
                          />
                        </Localizer>
                        <div class="input-group-append">
                          <span class="input-group-text">
                            {(props.thermostatEditTempUnit || 'C') === 'F' ? '°F' : '°C'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-group">
                      <label class="form-label">
                        <Text id="integration.thermostat.edit.maxTempLabel" />
                      </label>
                      <div class="input-group">
                        <Localizer>
                          <input
                            type="number"
                            class="form-control"
                            placeholder={<Text id="integration.thermostat.edit.maxTempPlaceholder" />}
                            value={props.thermostatEditMaxTemp}
                            onInput={e => props.updateThermostatField('thermostatEditMaxTemp', e.target.value)}
                          />
                        </Localizer>
                        <div class="input-group-append">
                          <span class="input-group-text">
                            {(props.thermostatEditTempUnit || 'C') === 'F' ? '°F' : '°C'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* What the appliance says it accepts, inside the fold with the two
                  fields it is about. Adopting it on picking the setpoint feature
                  covers the usual path, but not a thermostat edited later or a
                  setpoint chosen before the unit was settled — and a Netatmo left
                  at 5-35 promises two degrees it will refuse or silently clamp. */}
                {rangeDiffers && (
                  <div class="form-group">
                    <small class="form-text text-muted">
                      <Text
                        id="integration.thermostat.edit.deviceRangeHint"
                        fields={{ min: targetRange.min, max: targetRange.max, unit: formUnit }}
                      />{' '}
                      <button type="button" class="btn btn-link btn-sm p-0 align-baseline" onClick={applyDeviceRange}>
                        <Text id="integration.thermostat.edit.deviceRangeApply" />
                      </button>
                    </small>
                  </div>
                )}
              </details>
            )}

            {/* Folded like the range above: six rows of temperatures with working
                defaults, and the longest block on a form that already runs about
                three and a half screens on a phone. */}
            <details class={cx('mb-3', style.tuningDetails)}>
              <summary class={cx('form-label', style.tuningSummary)}>
                <i class={`fe fe-chevron-right ${style.tuningChevron}`} aria-hidden="true" />
                <Text id="integration.thermostat.edit.presetsLabel" />
              </summary>
              <table class="table table-sm table-borderless mb-0">
                <thead>
                  <tr>
                    <th class={style.presetColName}>
                      <Text id="integration.thermostat.edit.presetColNameLabel" />
                    </th>
                    <th>
                      {/* A heater regulating itself takes no temperature: each
                          preset sends an order instead (spec C.1.1). A
                          reversible heat pump has a setpoint for each use. */}
                      <Text
                        id={
                          presetsAreOrders
                            ? 'integration.thermostat.edit.presetColOrderLabel'
                            : reversible
                            ? 'integration.thermostat.edit.mode.heating'
                            : 'integration.thermostat.edit.presetColTempLabel'
                        }
                      />
                    </th>
                    {reversible && (
                      <th>
                        <Text id="integration.thermostat.edit.mode.cooling" />
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {['off', ...activePresets].map(key => (
                    <tr key={key}>
                      <td class="align-middle">
                        <span class={style.presetColorDot} style={`--dot-color:${getPresetColor(key, mode)}`} />
                        <Text id={`integration.thermostat.edit.preset.${key}`} />
                      </td>
                      <td class="align-middle">
                        {presetsAreOrders && key === 'off' && (
                          <Text id="deviceFeatureAction.category.heater.pilot-wire-mode.off" />
                        )}
                        {presetsAreOrders && key !== 'off' && (
                          <select
                            class="form-control form-control-sm"
                            value={pilotWireOrders[key]}
                            onChange={e => props.updateThermostatPilotWireOrder(key, Number(e.target.value))}
                          >
                            {orderOptionsFor(key).map(([value, orderKey]) => (
                              <option value={value} selected={value === pilotWireOrders[key]}>
                                <Text id={`deviceFeatureAction.category.heater.pilot-wire-mode.${orderKey}`} />
                              </option>
                            ))}
                          </select>
                        )}
                        {presetsAreOrders ? null : presetFields[key] ? (
                          presetTempInput(presetFields[key])
                        ) : (
                          <span class="text-muted">—</span>
                        )}
                      </td>
                      {reversible && (
                        <td class="align-middle">
                          {coolingPresetFields[key] ? (
                            presetTempInput(coolingPresetFields[key])
                          ) : (
                            <span class="text-muted">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>

            <h4 class={style.formSection}>
              <Text id="integration.thermostat.edit.sectionProgramming" />
            </h4>

            {/* Planning actif */}
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.thermostat.edit.activeScheduleLabel" />
              </label>
              <select
                class="form-control"
                value={props.thermostatEditActiveSchedule || ''}
                onChange={e => props.updateThermostatField('thermostatEditActiveSchedule', e.target.value)}
              >
                <option value="">
                  <Text id="integration.thermostat.edit.noActiveSchedule" />
                </option>
                {schedulesOfHouse.map(schedule => (
                  <option
                    key={schedule.selector}
                    value={schedule.selector}
                    selected={schedule.selector === props.thermostatEditActiveSchedule}
                  >
                    {scheduleLabel(schedule)}
                  </option>
                ))}
              </select>
              <small class="form-text text-muted">
                <Text id="integration.thermostat.edit.activeScheduleHelp" />
              </small>
            </div>

            {/* Fin du mode manuel : durée fixe, ou prochain créneau du planning.
                Le serveur choisit le prochain créneau quand aucune durée n'est
                configurée, donc « prochain créneau » s'exprime en n'écrivant
                pas le paramètre. */}
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.thermostat.edit.manualExpiryLabel" />
              </label>
              <select
                class="form-control"
                value={props.thermostatEditManualExpiry === 'next-transition' ? 'next-transition' : 'fixed'}
                onChange={e => props.updateThermostatField('thermostatEditManualExpiry', e.target.value)}
              >
                <option value="fixed">
                  <Text id="integration.thermostat.edit.manualExpiryFixed" />
                </option>
                <option value="next-transition">
                  <Text id="integration.thermostat.edit.manualExpiryNextTransition" />
                </option>
              </select>
              <small class="form-text text-muted">
                <Text id="integration.thermostat.edit.manualExpiryHelp" />
              </small>
            </div>

            {/* Durée mode manuel */}
            {props.thermostatEditManualExpiry !== 'next-transition' && (
              <div class="form-group">
                <label class="form-label">
                  <Text id="integration.thermostat.edit.manualDurationLabel" />
                </label>
                {/* Not full width: the field holds two digits, and a control
                    stretched across the card suggested a long value was wanted. */}
                <div class={cx('input-group', style.shortNumberField)}>
                  <input
                    type="number"
                    class="form-control"
                    min="1"
                    max="480"
                    value={props.thermostatEditManualDuration || '30'}
                    onInput={e => props.updateThermostatField('thermostatEditManualDuration', e.target.value)}
                    step="1"
                  />
                  <div class="input-group-append">
                    <span class="input-group-text">
                      <Text id="integration.thermostat.edit.manualDurationUnit" />
                    </span>
                  </div>
                </div>
                <small class="form-text text-muted">
                  <Text id="integration.thermostat.edit.manualDurationHelp" />
                </small>
              </div>
            )}

            <SaveError status={props.thermostatCreateStatus} reason={props.thermostatEditError} />
          </div>
        </div>
      </div>
      {/* Sticky, not `fixed-bottom`: the dark theme puts `filter: invert(100%)` on
          <html>, which makes it the containing block of every fixed element — the
          bar then measures against the document rather than the viewport and
          parks at the foot of the page. Sticky ignores an ancestor's filter, keeps
          the card's own width, and settles into place at the end of the form.

          A real thermostat's form runs about three and a half screens, so Save sat
          below the fold the whole time it was being filled in. */}
      <div class={stickyStyle.stickyActions}>
        <a href="/dashboard/integration/device/thermostat" class="btn btn-secondary">
          <Text id="integration.thermostat.edit.cancelButton" /> <i class="fe fe-slash" />
        </a>
        <button
          onClick={props.saveThermostatDevice}
          class={cx('btn', 'btn-success', 'ml-2', { 'btn-loading': saving })}
        >
          <Text id="integration.thermostat.edit.saveButton" /> <i class="fe fe-save" />
        </button>
      </div>
    </div>
  );
};

export default EditForm;
