import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_UNITS,
  DEVICE_FEATURE_TYPES
} from '../../../../server/utils/constants';
import { DeviceFeatureCategoriesIcon } from '../../utils/consts';
import get from 'get-value';

class UpdateDeviceFeature extends Component {
  updateName = e => this.props.updateFeatureProperty(this.props.featureIndex, 'name', e.target.value);
  updateExternalId = e => this.props.updateFeatureProperty(this.props.featureIndex, 'external_id', e.target.value);
  updateMin = e => this.props.updateFeatureProperty(this.props.featureIndex, 'min', e.target.value);
  updateMax = e => this.props.updateFeatureProperty(this.props.featureIndex, 'max', e.target.value);
  updateUnit = e => this.props.updateFeatureProperty(this.props.featureIndex, 'unit', e.target.value);
  updateType = e => this.props.updateFeatureProperty(this.props.featureIndex, 'type', e.target.value);
  deleteFeature = e => this.props.deleteFeature(this.props.featureIndex);

  render(props, {}) {
    return (
      <div class="col-md-4">
        <div class="card">
          <div class="card-header">
            <i
              class={`mr-2 fe fe-${get(
                DeviceFeatureCategoriesIcon,
                `${props.feature.category}.${props.feature.type}`
              )}`}
            />
            <Text id={`deviceFeatureCategory.${props.feature.category}.${props.feature.type}`} />
          </div>
          <div class="card-body">
            <div class="form-group form-label" for={`featureName_${props.featureIndex}`}>
              <label>
                <Text id="editDeviceForm.nameLabel" />
              </label>
              <Localizer>
                <input
                  id={`featureName_${props.featureIndex}`}
                  type="text"
                  value={props.feature.name}
                  onInput={this.updateName}
                  class="form-control"
                  placeholder={<Text id="editDeviceForm.namePlaceholder" />}
                />
              </Localizer>
            </div>
            {props.allowModifyFeatures && (
              <div class="form-group">
                <label class="form-label" for={`externalid_${props.featureIndex}`}>
                  <Text id="editDeviceForm.externalIdLabel" />
                </label>
                <Localizer>
                  <input
                    id={`externalid_${props.featureIndex}`}
                    type="text"
                    value={props.feature.external_id}
                    onInput={this.updateExternalId}
                    class="form-control"
                    placeholder={<Text id="editDeviceForm.externalIdPlaceholder" />}
                  />
                </Localizer>
              </div>
            )}
            {props.feature.category === DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR && (
              <div class="form-group">
                <label class="form-label" for={`externalid_${props.featureIndex}`}>
                  <Text id="editDeviceForm.unitLabel" />
                </label>
                <Localizer>
                  <select
                    id={`unit_${props.featureIndex}`}
                    type="text"
                    value={props.feature.unit}
                    onChange={this.updateUnit}
                    class="form-control"
                  >
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    <option value={DEVICE_FEATURE_UNITS.CELSIUS}>
                      <Text id="deviceFeatureUnit.celsius" />
                    </option>
                    <option value={DEVICE_FEATURE_UNITS.FAHRENHEIT}>
                      <Text id="deviceFeatureUnit.fahrenheit" />
                    </option>
                  </select>
                </Localizer>
              </div>
            )}
            {props.feature.category === DEVICE_FEATURE_CATEGORIES.SETPOINT &&
              props.feature.type !== DEVICE_FEATURE_TYPES.SENSOR.STRING && (
                <div class="form-group">
                  <label class="form-label" for={`externalid_${props.featureIndex}`}>
                    <Text id="editDeviceForm.unitLabel" />
                  </label>
                  <Localizer>
                    <select
                      id={`unit_${props.featureIndex}`}
                      type="text"
                      value={props.feature.unit}
                      onChange={this.updateUnit}
                      class="form-control"
                    >
                      <option value="">
                        <Text id="global.emptySelectOption" />
                      </option>
                      <option value={DEVICE_FEATURE_UNITS.CELSIUS}>
                        <Text id="deviceFeatureUnit.celsius" />
                      </option>
                      <option value={DEVICE_FEATURE_UNITS.FAHRENHEIT}>
                        <Text id="deviceFeatureUnit.fahrenheit" />
                      </option>
                    </select>
                  </Localizer>
                </div>
              )}
            {props.feature.category === DEVICE_FEATURE_CATEGORIES.CO2_SENSOR && (
              <div class="form-group">
                <label class="form-label" for={`externalid_${props.featureIndex}`}>
                  <Text id="editDeviceForm.unitLabel" />
                </label>
                <Localizer>
                  <select
                    id={`unit_${props.featureIndex}`}
                    type="text"
                    value={props.feature.unit}
                    onChange={this.updateUnit}
                    class="form-control"
                  >
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    <option value={DEVICE_FEATURE_UNITS.PERCENT}>
                      <Text id="deviceFeatureUnit.percent" />
                    </option>
                    <option value={DEVICE_FEATURE_UNITS.PPM}>
                      <Text id="deviceFeatureUnit.ppm" />
                    </option>
                  </select>
                </Localizer>
              </div>
            )}
            {props.feature.category === DEVICE_FEATURE_CATEGORIES.INDEX && (
              <div class="form-group">
                <label class="form-label" for={`externalid_${props.featureIndex}`}>
                  <Text id="editDeviceForm.unitLabel" />
                </label>
                <Localizer>
                  <select
                    id={`type_${props.featureIndex}`}
                    type="text"
                    value={props.feature.type}
                    onChange={this.updateType}
                    class="form-control"
                  >
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    <option value={DEVICE_FEATURE_TYPES.INDEX.INTEGER}>
                      <Text id="deviceFeatureCategory.index.integer" />
                    </option>
                    <option value={DEVICE_FEATURE_TYPES.INDEX.DIMMER}>
                      <Text id="deviceFeatureCategory.index.dimmer" />
                    </option>
                  </select>
                </Localizer>
              </div>
            )}
            {props.feature.category === DEVICE_FEATURE_CATEGORIES.ANGLE_SENSOR && (
              <div class="form-group">
                <label class="form-label" for={`externalid_${props.featureIndex}`}>
                  <Text id="editDeviceForm.unitLabel" />
                </label>
                <Localizer>
                  <select
                    id={`type_${props.featureIndex}`}
                    type="text"
                    value={props.feature.type}
                    onChange={this.updateType}
                    class="form-control"
                  >
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    <option value={DEVICE_FEATURE_TYPES.SENSOR.STRING}>
                      <Text id="deviceFeatureCategory.angle-sensor.string" />
                    </option>
                    <option value={DEVICE_FEATURE_TYPES.SENSOR.DECIMAL}>
                      <Text id="deviceFeatureCategory.angle-sensor.decimal" />
                    </option>
                  </select>
                </Localizer>
              </div>
            )}
            {props.allowModifyFeatures && (
              <div class="form-group">
                <label class="form-label" for={`min_${props.featureIndex}`}>
                  <Text id="editDeviceForm.minLabel" />
                </label>
                <Localizer>
                  <input
                    id={`min_${props.featureIndex}`}
                    type="number"
                    value={props.feature.min}
                    onInput={this.updateMin}
                    class="form-control"
                    placeholder={<Text id="editDeviceForm.minPlaceholder" />}
                  />
                </Localizer>
              </div>
            )}
            {props.allowModifyFeatures && (
              <div class="form-group">
                <label class="form-label" for={`max_${props.featureIndex}`}>
                  <Text id="editDeviceForm.maxLabel" />
                </label>
                <Localizer>
                  <input
                    id={`max_${props.featureIndex}`}
                    type="number"
                    value={props.feature.max}
                    onInput={this.updateMax}
                    class="form-control"
                    placeholder={<Text id="editDeviceForm.maxPlaceholder" />}
                  />
                </Localizer>
              </div>
            )}
            {props.allowModifyFeatures && (
              <div class="form-group">
                <button onClick={props.deleteFeature} class="btn btn-outline-danger">
                  <Text id="editDeviceForm.deleteLabel" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default UpdateDeviceFeature;
