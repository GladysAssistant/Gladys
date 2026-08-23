import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import { getPresetColor } from '../../../../../utils/thermostatPresetColors';

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

const EditForm = ({ ...props }) => {
  const saving = props.thermostatCreateStatus === RequestStatus.Getting;
  const isEdit = !!(props.thermostatEditDevice && props.thermostatEditDevice.selector);
  const mode = props.thermostatEditMode || 'heating';
  // The control rules read the other way round in cooling: the switch turns on
  // when the room is too warm. The help texts are therefore per-mode, not a
  // heating text with the word swapped.
  const modeSuffix = mode === 'cooling' ? 'cooling' : 'heating';

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
            {props.thermostatCreateStatus === RequestStatus.Error && (
              <div class="alert alert-danger">
                <Text id="integration.thermostat.edit.saveError" />
              </div>
            )}

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

            {/* Mode */}
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
            </div>

            {/* Type de calcul + paramètres associés */}
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
                        onInput={e => props.updateThermostatField('thermostatEditHysteresisStart', e.target.value)}
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
                        onInput={e => props.updateThermostatField('thermostatEditTpiProportionalBand', e.target.value)}
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

            {/* Unité + Plage de température */}
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
              <div class="col-md-4">
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
              <div class="col-md-4">
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

            {/* Commutateur */}
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

            {/* Presets : nom + couleur fixe + température */}
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.thermostat.edit.presetsLabel" />
              </label>
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
                          <div class="input-group input-group-sm">
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
            </div>

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
                {props.thermostatSchedules &&
                  props.thermostatSchedules.map(schedule => (
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

            {/* Durée mode manuel */}
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.thermostat.edit.manualDurationLabel" />
              </label>
              <div class="input-group">
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

            <div class="row mt-2">
              <div class="col">
                <button
                  onClick={props.saveThermostatDevice}
                  class={cx('btn', 'btn-success', { 'btn-loading': saving })}
                >
                  <Text id="integration.thermostat.edit.saveButton" />
                </button>
                <a href="/dashboard/integration/device/thermostat" class="btn btn-secondary ml-2">
                  <Text id="integration.thermostat.edit.cancelButton" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditForm;
