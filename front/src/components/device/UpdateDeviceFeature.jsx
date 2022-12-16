import { Component } from 'preact';
import { Text, Localizer, MarkupText } from 'preact-i18n';
import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS_BY_CATEGORY
} from '../../../../server/utils/constants';
import { DeviceFeatureCategoriesIcon } from '../../utils/consts';
import get from 'get-value';

const DEVICE_FEATURE_COMPATIBLE_CATEGORY = {
  [DEVICE_FEATURE_TYPES.SWITCH.BINARY]: [DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_CATEGORIES.SWITCH],
  [DEVICE_FEATURE_TYPES.SHUTTER.STATE]: [DEVICE_FEATURE_CATEGORIES.SHUTTER, DEVICE_FEATURE_CATEGORIES.CURTAIN]
};

class UpdateDeviceFeature extends Component {
  updateName = e => this.props.updateFeatureProperty(this.props.featureIndex, 'name', e.target.value);
  updateExternalId = e => this.props.updateFeatureProperty(this.props.featureIndex, 'external_id', e.target.value);
  updateMin = e => this.props.updateFeatureProperty(this.props.featureIndex, 'min', e.target.value);
  updateMax = e => this.props.updateFeatureProperty(this.props.featureIndex, 'max', e.target.value);
  updateUnit = e => this.props.updateFeatureProperty(this.props.featureIndex, 'unit', e.target.value);
  updateCategory = e => this.props.updateFeatureProperty(this.props.featureIndex, 'category', e.target.value);
  updateKeepHistory = () => {
    const e = {
      target: {
        value: !this.props.feature.keep_history
      }
    };
    this.props.updateFeatureProperty(this.props.featureIndex, 'keep_history', e.target.value);
  };
  deleteFeature = () => this.props.deleteFeature(this.props.featureIndex);

  render({ feature, featureIndex, canEditCategory, device, ...props }) {
    const allowModifyCategory =
      canEditCategory && canEditCategory(device, feature) && DEVICE_FEATURE_COMPATIBLE_CATEGORY[feature.type];

    return (
      <div class="col-md-4">
        <div class="card">
          <div class="card-header">
            <i class={`mr-2 fe fe-${get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`)}`} />
            <Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`} />
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
            {allowModifyCategory && (
              <div class="form-group form-label" for={`featureCategory_${featureIndex}`}>
                <label>
                  <Text id="editDeviceForm.featureCategoryLabel" />
                </label>
                <Localizer>
                  <select
                    id={`unit_${featureIndex}`}
                    type="text"
                    value={feature.category}
                    onChange={this.updateCategory}
                    class="form-control"
                  >
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {DEVICE_FEATURE_COMPATIBLE_CATEGORY[feature.type].map(type => (
                      <option value={type}>
                        <Text id={`deviceFeatureCategory.${type}.shortCategoryName`}>{type}</Text>
                      </option>
                    ))}
                  </select>
                </Localizer>
              </div>
            )}
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
            <div class="page-options d-flex">
              <div class="form-group">
                <div class="form-label">
                  <Text id="editDeviceForm.keepHistoryLabel" />
                </div>
                <label class="custom-switch">
                  <input
                    id={`keep_history_${featureIndex}`}
                    type="checkbox"
                    checked={feature.keep_history}
                    onClick={this.updateKeepHistory}
                    class="custom-switch-input"
                  />
                  <span class="custom-switch-indicator" />
                  <span class="custom-switch-description">
                    <Text id="editDeviceForm.keepHistorySmallDescription" />
                  </span>
                </label>
                <p class="mt-2">
                  <small>
                    <MarkupText id="editDeviceForm.keepHistoryDescription" />
                  </small>
                </p>
              </div>
            </div>
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
