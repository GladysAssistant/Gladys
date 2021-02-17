import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { DEVICE_FEATURE_UNITS_BY_CATEGORY } from '../../../../server/utils/constants';
import { DeviceFeatureCategoriesIcon } from '../../utils/consts';
import get from 'get-value';

class UpdateDeviceFeature extends Component {
  updateName = e => this.props.updateFeatureProperty(this.props.featureIndex, 'name', e.target.value);
  updateExternalId = e => this.props.updateFeatureProperty(this.props.featureIndex, 'external_id', e.target.value);
  updateMin = e => this.props.updateFeatureProperty(this.props.featureIndex, 'min', e.target.value);
  updateMax = e => this.props.updateFeatureProperty(this.props.featureIndex, 'max', e.target.value);
  updateUnit = e => this.props.updateFeatureProperty(this.props.featureIndex, 'unit', e.target.value);
  deleteFeature = e => this.props.deleteFeature(this.props.featureIndex);
  updateCategorySwitchLight = e => {
    this.props.paramDeviceFeature[this.props.feature.external_id].toggleCategoryChange = e.target.checked;
    this.props.updateFeatureProperty(this.props.featureIndex, 'categorySwitchLight', e.target.checked);
  };

  render({ feature, featureIndex, param, ...props }) {
    return (
      <div class="col-md-4">
        <div class="card">
          <div class="card-header">
            <div class="col-7">
              <i class={`mr-2 fe fe-${get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`)}`} />
              <Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`} />
            </div>
            {props.paramDeviceFeature[feature.external_id] &&
              props.paramDeviceFeature[feature.external_id].toggleCategoryChange && (
                <div class="col-6 text-right">
                  <Text id="editDeviceForm.categoryChange" />
                  <Text
                    id={`deviceFeatureCategory.${props.paramDeviceFeature[feature.external_id].value}.${feature.type}`}
                  />
                </div>
              )}
          </div>
          <div class="card-body">
            <div class="form-group form-label" for={`featureName_${featureIndex}`}>
              <label>
                <Text id="editDeviceForm.nameLabel" />
              </label>
              <Localizer>
                <input
                  id={`featureName_${featureIndex}`}
                  type="text"
                  value={feature.name}
                  onInput={this.updateName}
                  class="form-control"
                  placeholder={<Text id="editDeviceForm.namePlaceholder" />}
                />
              </Localizer>
            </div>
            {props.allowModifyFeatures && (
              <div class="form-group">
                <label class="form-label" for={`externalid_${featureIndex}`}>
                  <Text id="editDeviceForm.externalIdLabel" />
                </label>
                <Localizer>
                  <input
                    id={`externalid_${featureIndex}`}
                    type="text"
                    value={feature.external_id}
                    onInput={this.updateExternalId}
                    class="form-control"
                    placeholder={<Text id="editDeviceForm.externalIdPlaceholder" />}
                  />
                </Localizer>
              </div>
            )}
            {DEVICE_FEATURE_UNITS_BY_CATEGORY[feature.category] && (
              <div class="form-group">
                <label class="form-label" for={`externalid_${featureIndex}`}>
                  <Text id="editDeviceForm.unitLabel" />
                </label>
                <Localizer>
                  <select
                    id={`unit_${featureIndex}`}
                    type="text"
                    value={feature.unit}
                    onChange={this.updateUnit}
                    class="form-control"
                  >
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {DEVICE_FEATURE_UNITS_BY_CATEGORY[feature.category].map(unit => (
                      <option value={unit}>
                        <Text id={`deviceFeatureUnit.${unit}`}>{unit}</Text>
                      </option>
                    ))}
                  </select>
                </Localizer>
              </div>
            )}
            {props.allowModifyFeatures && (
              <div class="form-group">
                <label class="form-label" for={`min_${featureIndex}`}>
                  <Text id="editDeviceForm.minLabel" />
                </label>
                <Localizer>
                  <input
                    id={`min_${featureIndex}`}
                    type="number"
                    value={feature.min}
                    onInput={this.updateMin}
                    class="form-control"
                    placeholder={<Text id="editDeviceForm.minPlaceholder" />}
                  />
                </Localizer>
              </div>
            )}
            {props.allowModifyFeatures && (
              <div class="form-group">
                <label class="form-label" for={`max_${featureIndex}`}>
                  <Text id="editDeviceForm.maxLabel" />
                </label>
                <Localizer>
                  <input
                    id={`max_${featureIndex}`}
                    type="number"
                    value={feature.max}
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
            {props.paramDeviceFeature[feature.external_id] && (
              <div class="col-12">
                <label class="form-check form-switch">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    checked={props.paramDeviceFeature[feature.external_id].toggleCategoryChange}
                    onChange={this.updateCategorySwitchLight}
                  />
                  <span class="form-check-label">
                    <Text id="editDeviceForm.checkbox.changeCategory" />
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default UpdateDeviceFeature;
