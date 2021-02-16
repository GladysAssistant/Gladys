import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { DEVICE_FEATURE_TYPES_BY_CATEGORY } from '../../../../../../../../../server/utils/constants';
import { DeviceFeatureCategoriesIcon } from '../../../../../../../utils/consts';
import get from 'get-value';

class UpdateDeviceFeature extends Component {
  updateName = e => this.props.updateFeatureProperty(this.props.featureIndex, 'name', e.target.value);
  updateExternalId = e => this.props.updateFeatureProperty(this.props.featureIndex, 'external_id', e.target.value);
  updateMin = e => this.props.updateFeatureProperty(this.props.featureIndex, 'min', e.target.value);
  updateMax = e => this.props.updateFeatureProperty(this.props.featureIndex, 'max', e.target.value);
  updateUnit = e => this.props.updateFeatureProperty(this.props.featureIndex, 'unit', e.target.value);
  updateType = e => this.props.updateFeatureProperty(this.props.featureIndex, 'type', e.target.value);
  deleteFeature = e => this.props.deleteFeature(this.props.featureIndex);

  render({ feature, featureIndex, ...props }) {
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
            {DEVICE_FEATURE_TYPES_BY_CATEGORY[feature.category] && (
              <div class="form-group">
                <label class="form-label" for={`externalid_${featureIndex}`}>
                  <Text id="editDeviceForm.typeLabel" />
                </label>
                <Localizer>
                  <select
                    id={`unit_${featureIndex}`}
                    type="text"
                    value={feature.type}
                    onChange={this.updateType}
                    class="form-control"
                  >
                    {DEVICE_FEATURE_TYPES_BY_CATEGORY[feature.category].map(type => (
                      <option value={type}>
                        <Text id={`deviceFeatureCategory.${feature.category}.${type}`}>{type}</Text>
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
          </div>
        </div>
      </div>
    );
  }
}

export default UpdateDeviceFeature;
