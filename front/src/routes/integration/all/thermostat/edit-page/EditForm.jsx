import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import stickyStyle from '../stickyActions.css';
import { getPresetColor } from '../../../../../utils/thermostatPresetColors';
import { DEVICE_FEATURE_UNITS } from '../../../../../../../server/utils/constants';

const FeatureSelect = ({ value, features, onChange, emptyLabel }) => (
  <select class="form-control" value={value} onChange={onChange}>
    <option value="">{emptyLabel}</option>
    {features &&
      features.map(f => (
        <option key={f.selector} value={f.selector} selected={f.selector === value}>
          {f.label}
        </option>
      ))}
  </select>
);

// Rendered by the Save button rather than at the top of the form: it answers a
// press on that button, and the form runs to several screens — at the top it was
// out of sight of the thing that caused it.
const SaveError = ({ status, reason }) =>
  status === RequestStatus.Error && (
    <div class="alert alert-danger">
      {reason === 'incompleteVirtual' && <Text id="integration.thermostat.edit.incompleteVirtualError" />}
      {reason === 'incompleteExternal' && <Text id="integration.thermostat.edit.incompleteExternalError" />}
      {!reason && <Text id="integration.thermostat.edit.saveError" />}
    </div>
  );

const EditForm = ({ ...props }) => {
  const saving = props.thermostatCreateStatus === RequestStatus.Getting;
  const isEdit = !!(props.thermostatEditDevice && props.thermostatEditDevice.selector);
  const mode = props.thermostatEditMode || 'heating';
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
  const schedulesOfHouse = selectedHouse
    ? (props.thermostatSchedules || []).filter(schedule => schedule.house === selectedHouse.selector)
    : props.thermostatSchedules || [];

  const heatingPresets = ['frost', 'away', 'eco', 'night', 'comfort'];
  const coolingPresets = ['comfort'];
  const activePresets = mode === 'cooling' ? coolingPresets : heatingPresets;

  const presetFields = {
    frost: 'thermostatEditPresetFrost',
    away: 'thermostatEditPresetAway',
    eco: 'thermostatEditPresetEco',
    night: 'thermostatEditPresetNight',
    comfort: 'thermostatEditPresetComfort'
  };

  const controlType = props.thermostatEditControlType || 'hysteresis';
  // A real thermostat runs its own heuristic and drives its own heater: Gladys
  // only writes the setpoint its schedule resolves. Hysteresis, TPI and the
  // switch are therefore hidden — offering them would suggest Gladys regulates
  // a device that regulates itself.
  const isExternalThermostat = props.thermostatEditType === 'external';

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
    props.updateThermostatField('thermostatEditTargetFeature', selector);
    const picked = (props.targetFeatures || []).find(feature => feature.selector === selector);
    if (!picked) {
      return;
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
            </div>

            {/* Type de thermostat */}
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.thermostat.edit.typeLabel" />
              </label>
              <select
                class="form-control"
                value={props.thermostatEditType || 'virtual'}
                onChange={e => props.updateThermostatField('thermostatEditType', e.target.value)}
              >
                <option value="virtual">
                  <Text id="integration.thermostat.edit.typeVirtual" />
                </option>
                <option value="external">
                  <Text id="integration.thermostat.edit.typeExternal" />
                </option>
              </select>
              <small class="form-text text-muted">
                <Text id={`integration.thermostat.edit.typeHelp.${isExternalThermostat ? 'external' : 'virtual'}`} />
              </small>
            </div>

            {/* Usage: what this thermostat drives. Directly under the type,
                and no longer called "Mode": it used to sit right after the
                device's own "Operating mode (optional)", and two fields named
                Mode in a row read as the same question asked twice. */}
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.thermostat.edit.modeLabel" />
              </label>
              <select
                class="form-control"
                value={mode}
                onChange={e => {
                  props.updateThermostatField('thermostatEditMode', e.target.value);
                  // TPI is heating-only: switching to cooling falls back to hysteresis
                  if (e.target.value === 'cooling' && controlType === 'tpi') {
                    props.updateThermostatField('thermostatEditControlType', 'hysteresis');
                  }
                }}
              >
                <option value="heating">
                  <Text id="integration.thermostat.edit.mode.heating" />
                </option>
                <option value="cooling">
                  <Text id="integration.thermostat.edit.mode.cooling" />
                </option>
              </select>
              <small class="form-text text-muted">
                <Text id="integration.thermostat.edit.modeHelp" />
              </small>
            </div>

            {/* Thermostat réel piloté */}
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
                      features={props.targetFeatures}
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
                      features={props.stateFeatures}
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
                      features={props.modeFeatures}
                      onChange={e => props.updateThermostatField('thermostatEditModeFeature', e.target.value)}
                      emptyLabel={<Text id="global.emptySelectOption" />}
                    />
                  </Localizer>
                  <small class="form-text text-muted">
                    <Text id="integration.thermostat.edit.modeFeatureHelp" />
                  </small>
                </div>
              </div>
            )}

            <h4 class={style.formSection}>
              <Text id="integration.thermostat.edit.sectionHeating" />
            </h4>

            {/* Capteur de température */}
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.thermostat.edit.temperatureFeatureLabel" />
              </label>
              <Localizer>
                <FeatureSelect
                  value={props.thermostatEditTemperatureFeature || ''}
                  features={props.temperatureFeatures}
                  onChange={e => props.updateThermostatField('thermostatEditTemperatureFeature', e.target.value)}
                  emptyLabel={<Text id="global.emptySelectOption" />}
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
                  features={props.humidityFeatures}
                  onChange={e => props.updateThermostatField('thermostatEditHumidityFeature', e.target.value)}
                  emptyLabel={<Text id="global.emptySelectOption" />}
                />
              </Localizer>
              <small class="form-text text-muted">
                <Text id="integration.thermostat.edit.humidityFeatureHelp" />
              </small>
            </div>

            {/* Commutateur : seul un thermostat virtuel pilote un interrupteur. */}
            {!isExternalThermostat && (
              <div class="form-group">
                <label class="form-label">
                  <Text id="integration.thermostat.edit.switchFeatureLabel" />
                </label>
                <Localizer>
                  <FeatureSelect
                    value={props.thermostatEditSwitchFeature || ''}
                    features={props.switchFeatures}
                    onChange={e => props.updateThermostatField('thermostatEditSwitchFeature', e.target.value)}
                    emptyLabel={<Text id="global.emptySelectOption" />}
                  />
                </Localizer>
                <small class="form-text text-muted">
                  <Text id={`integration.thermostat.edit.switchFeatureHelp.${modeSuffix}`} />
                </small>
              </div>
            )}

            {/* Capteur d'ouverture de fenêtre */}
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.thermostat.edit.windowFeatureLabel" />
              </label>
              <Localizer>
                <FeatureSelect
                  value={props.thermostatEditWindowFeature || ''}
                  features={props.openingFeatures}
                  onChange={e => props.updateThermostatField('thermostatEditWindowFeature', e.target.value)}
                  emptyLabel={<Text id="global.emptySelectOption" />}
                />
              </Localizer>
              <small class="form-text text-muted">
                <Text id={`integration.thermostat.edit.windowFeatureHelp.${modeSuffix}`} />
              </small>
            </div>

            {/* Folded away: the control type and its hysteresis or TPI figures
                all have working defaults, and putting them ahead of the sensor
                and the actuator buried the two fields that decide whether the
                thermostat regulates at all. A real thermostat runs its own
                heuristic, so none of this applies to it.

                The unit and the bounds stay out of the fold below: they are the
                thermostat's own, external ones included. */}
            {!isExternalThermostat && (
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
                      {mode !== 'cooling' && (
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
                      <Text id="integration.thermostat.edit.presetColTempLabel" />
                    </th>
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
                        {presetFields[key] ? (
                          <div class={cx('input-group', 'input-group-sm', style.presetTempGroup)}>
                            <input
                              type="number"
                              class={`form-control ${style.presetTempInput}`}
                              value={props[presetFields[key]]}
                              onInput={e => props.updateThermostatField(presetFields[key], e.target.value)}
                              step="0.5"
                            />
                            <div class="input-group-append">
                              <span class="input-group-text">
                                {(props.thermostatEditTempUnit || 'C') === 'F' ? '°F' : '°C'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span class="text-muted">—</span>
                        )}
                      </td>
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
                    {schedule.name}
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
