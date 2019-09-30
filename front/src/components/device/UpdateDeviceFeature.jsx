import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_UNITS } from '../../../../server/utils/constants';
import { DeviceFeatureCategoriesIcon } from '../../utils/consts';
import get from 'get-value';

class UpdateDeviceFeature extends Component {
  updateName = e => this.props.updateFeatureProperty(this.props.featureIndex, 'name', e.target.value);
  updateExternalId = e => this.props.updateFeatureProperty(this.props.featureIndex, 'external_id', e.target.value);
  updateMin = e => this.props.updateFeatureProperty(this.props.featureIndex, 'min', e.target.value);
  updateMax = e => this.props.updateFeatureProperty(this.props.featureIndex, 'max', e.target.value);
  updateUnit = e => this.props.updateFeatureProperty(this.props.featureIndex, 'unit', e.target.value);
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
