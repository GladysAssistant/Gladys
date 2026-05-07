import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import Select, { components } from 'react-select';

import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, BUTTON_STATUS } from '../../../../../../server/utils/constants';

import SelectDeviceFeature from '../../../../components/device/SelectDeviceFeature';
import withIntlAsProp from '../../../../utils/withIntlAsProp';
import get from 'get-value';

// Option avec case à cocher — pas de fond coloré sur les lignes sélectionnées,
// seul le hover standard est conservé.
const CheckboxOption = props => (
  <components.Option {...props}>
    <input
      type="checkbox"
      checked={props.isSelected}
      readOnly
      style={{ marginRight: '8px', pointerEvents: 'none' }}
    />
    {props.label}
  </components.Option>
);

// ValueContainer qui remplace les chips par un résumé "N sélectionné(s)".
// Rend impérativement children (contient l'<input> interne de React Select) pour que
// l'ouverture au clic sur le contrôle et la fermeture au clic extérieur fonctionnent.
const SummaryValueContainer = ({ children, getValue, selectProps, ...rest }) => {
  const count = getValue().length;
  return (
    <components.ValueContainer {...rest} getValue={getValue} selectProps={selectProps}>
      <span style={{ color: count === 0 ? '#aaa' : 'inherit' }}>
        {count === 0
          ? selectProps.placeholder
          : `${count} sélectionné${count > 1 ? 's' : ''}`}
      </span>
      {/* children contient l'input caché nécessaire au focus/clic/fermeture */}
      {children[children.length - 1]}
    </components.ValueContainer>
  );
};

// Supprime le fond bleu des options sélectionnées — seul le hover est conservé
const MULTI_STYLES = {
  option: (base, { isFocused }) => ({
    ...base,
    backgroundColor: isFocused ? '#deebff' : 'transparent',
    color: 'inherit',
  }),
};

const MULTI_COMPONENTS = { Option: CheckboxOption, ValueContainer: SummaryValueContainer };

// Déclencheur "Changement d'état multiple" : se déclenche si la valeur de l'appareil
// correspond à l'une des valeurs sélectionnées (opérateur "=").
class DeviceFeatureMultiState extends Component {
  onDeviceFeatureChange = deviceFeature => {
    this.setState({ selectedDeviceFeature: deviceFeature });
    if (deviceFeature) {
      this.props.updateTriggerProperty(this.props.index, 'device_feature', deviceFeature.selector);
      if (deviceFeature.selector !== this.props.trigger.device_feature) {
        this.props.updateTriggerProperty(this.props.index, 'values', []);
      }
    } else {
      this.props.updateTriggerProperty(this.props.index, 'device_feature', null);
    }
  };

  handleMultiChange = selectedOptions => {
    const values = (selectedOptions || []).map(opt => opt.value);
    this.props.updateTriggerProperty(this.props.index, 'values', values);
  };

  addValue = () => {
    const current = this.props.trigger.values || [];
    this.props.updateTriggerProperty(this.props.index, 'values', [...current, '']);
  };

  removeValue = idx => {
    const current = this.props.trigger.values || [];
    this.props.updateTriggerProperty(this.props.index, 'values', current.filter((_, i) => i !== idx));
  };

  updateValue = (idx, rawValue) => {
    const current = [...(this.props.trigger.values || [])];
    const parsed = parseFloat(rawValue.replace(',', '.'));
    current[idx] = isNaN(parsed) ? rawValue : parsed;
    this.props.updateTriggerProperty(this.props.index, 'values', current);
  };

  onForDurationChange = e => {
    e.preventDefault();
    if (e.target.value) {
      this.props.updateTriggerProperty(this.props.index, 'for_duration', Number(e.target.value) * 60 * 1000);
    } else {
      this.props.updateTriggerProperty(this.props.index, 'for_duration', '');
    }
  };

  enableOrDisableForDuration = e => {
    e.preventDefault();
    if (e.target.checked) {
      this.props.updateTriggerProperty(this.props.index, 'for_duration', 60 * 1000);
    } else {
      this.props.updateTriggerProperty(this.props.index, 'for_duration', undefined);
    }
  };

  getButtonOptions = () =>
    Object.keys(BUTTON_STATUS).map(key => {
      const value = BUTTON_STATUS[key];
      return {
        label: get(this.props.intl.dictionary, `deviceFeatureValue.category.button.click.${value}`, { default: String(value) }),
        value,
      };
    });

  componentWillMount() {
    this.props.updateTriggerProperty(this.props.index, 'operator', '=');
  }

  render(props, { selectedDeviceFeature }) {
    const isButtonDevice =
      selectedDeviceFeature &&
      selectedDeviceFeature.category === DEVICE_FEATURE_CATEGORIES.BUTTON;

    const isBinaryDevice =
      selectedDeviceFeature &&
      selectedDeviceFeature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY;

    const values = props.trigger.values || [];
    const buttonOptions = isButtonDevice ? this.getButtonOptions() : [];
    const buttonSelected = buttonOptions.filter(opt => values.includes(opt.value));

    return (
      <div>
        <div class="row">
          {/* Sélecteur d'appareil */}
          <div class="col-12 col-md-6">
            <div class="form-group">
              <SelectDeviceFeature
                value={props.trigger.device_feature}
                onDeviceFeatureChange={this.onDeviceFeatureChange}
              />
            </div>
          </div>

          {/* Select boutons : liste déroulante avec coches, hauteur contrôle fixe */}
          {isButtonDevice && (
            <div class="col-12 col-md-6">
              <div class="form-group">
                <Select
                  isMulti
                  value={buttonSelected}
                  onChange={this.handleMultiChange}
                  options={buttonOptions}
                  hideSelectedOptions={false}
                  closeMenuOnSelect={false}
                  components={MULTI_COMPONENTS}
                  styles={MULTI_STYLES}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder="Sélectionner..."
                />
              </div>
            </div>
          )}

          {/* Cases à cocher On/Off pour les appareils binaires */}
          {isBinaryDevice && (
            <div class="col-12 col-md-6">
              <div class="form-group" style={{ marginTop: '8px' }}>
                <label class="form-check form-check-inline">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    checked={values.includes(1)}
                    onChange={e => {
                      const next = e.target.checked ? [...values, 1] : values.filter(v => v !== 1);
                      props.updateTriggerProperty(props.index, 'values', next);
                    }}
                  />
                  <span class="form-check-label">
                    <Text id="editScene.triggersCard.newState.on" />
                  </span>
                </label>
                <label class="form-check form-check-inline">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    checked={values.includes(0)}
                    onChange={e => {
                      const next = e.target.checked ? [...values, 0] : values.filter(v => v !== 0);
                      props.updateTriggerProperty(props.index, 'values', next);
                    }}
                  />
                  <span class="form-check-label">
                    <Text id="editScene.triggersCard.newState.off" />
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Liste de champs pour les appareils numériques/texte */}
          {selectedDeviceFeature && !isButtonDevice && !isBinaryDevice && (
            <div class="col-12 col-md-6">
              <div class="form-group">
                {values.map((val, idx) => (
                  <div class="input-group mb-1" key={idx}>
                    <Localizer>
                      <input
                        type="text"
                        class="form-control"
                        placeholder={<Text id="editScene.triggersCard.newState.valuePlaceholder" />}
                        value={val}
                        onInput={e => this.updateValue(idx, e.target.value)}
                      />
                    </Localizer>
                    <div class="input-group-append">
                      <button class="btn btn-outline-danger" type="button" onClick={() => this.removeValue(idx)}>
                        <i class="fe fe-trash-2" />
                      </button>
                    </div>
                  </div>
                ))}
                <button class="btn btn-sm btn-outline-secondary mt-1" type="button" onClick={this.addValue}>
                  <i class="fe fe-plus mr-1" />
                  <Text id="editScene.triggersCard.multiState.addValue" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Option "déclencher après N minutes de condition valide" */}
        <div class="row">
          <div class="col-12">
            <label class="form-check form-switch">
              <input
                class="form-check-input"
                type="checkbox"
                checked={props.trigger.for_duration !== undefined}
                onChange={this.enableOrDisableForDuration}
              />
              <span class="form-check-label">
                <Text id="editScene.triggersCard.newState.activateOrDeactivateForDuration" />
              </span>
            </label>
          </div>
        </div>
        {props.trigger.for_duration !== undefined && (
          <div class="row">
            <div class="col">
              <div class="form-group">
                <div class="input-group">
                  <Localizer>
                    <input
                      type="number"
                      class="form-control"
                      placeholder={<Text id="editScene.triggersCard.newState.valuePlaceholder" />}
                      value={
                        Number.isInteger(props.trigger.for_duration)
                          ? props.trigger.for_duration / 60 / 1000
                          : props.trigger.for_duration
                      }
                      onChange={this.onForDurationChange}
                    />
                  </Localizer>
                  <span class="input-group-append">
                    <span class="input-group-text">
                      <Text id="deviceFeatureUnitShort.minutes" />
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(DeviceFeatureMultiState));
