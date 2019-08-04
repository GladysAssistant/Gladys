import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import { DeviceFeatureCategoriesIcon } from '../../../../../../utils/consts';
import get from 'get-value';

class MqttFeatureBox extends Component {
  updateFeatureName(e) {
    this.props.updateFeatureProperty(this.props.deviceIndex, this.props.featureIndex, 'name', e.target.value);
  }

  updateFeatureExternalId(e) {
    this.props.updateFeatureProperty(this.props.deviceIndex, this.props.featureIndex, 'external_id', e.target.value);
  }

  updateFeatureMinValue(e) {
    this.props.updateFeatureProperty(this.props.deviceIndex, this.props.featureIndex, 'min', e.target.value);
  }

  updateFeatureMaxValue(e) {
    this.props.updateFeatureProperty(this.props.deviceIndex, this.props.featureIndex, 'max', e.target.value);
  }

  deleteFeature() {
    this.props.deleteFeature(this.props.deviceIndex, this.props.featureIndex);
  }

  constructor(props) {
    super(props);

    this.updateFeatureName = this.updateFeatureName.bind(this);
    this.updateFeatureExternalId = this.updateFeatureExternalId.bind(this);
    this.updateFeatureMinValue = this.updateFeatureMinValue.bind(this);
    this.updateFeatureMaxValue = this.updateFeatureMaxValue.bind(this);
    this.deleteFeature = this.deleteFeature.bind(this);
  }

  render({ ...props }) {
    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${props.feature.category}.${props.feature.type}`)}`} />
            <Text id={`deviceFeatureCategory.${props.feature.category}.${props.feature.type}`} />
          </div>
          <div class="card-body">
            <div class="form-group" class="form-label" for={`featueName_${props.featureIndex}`}>
              <label>
                <Text id="integration.mqtt.feature.nameLabel" />
              </label>
              <Localizer>
                <input
                  id={`featueName_${props.featureIndex}`}
                  type="text"
                  value={props.feature.name}
                  onChange={this.updateFeatureName}
                  class="form-control"
                  placeholder={<Text id="integration.mqtt.feature.namePlaceholder" />}
                />
              </Localizer>
            </div>

            <div class="form-group">
              <label class="form-label" for={`externalid_${props.featureIndex}`}>
                <Text id="integration.mqtt.feature.externalIdLabel" />
              </label>
              <Localizer>
                <input
                  id={`externalid_${props.featureIndex}`}
                  type="text"
                  value={props.feature.external_id}
                  onChange={this.updateFeatureExternalId}
                  class="form-control"
                  placeholder={<Text id="integration.mqtt.feature.externalIdPlaceholder" />}
                />
              </Localizer>
            </div>

            <div class="form-group">
              <label class="form-label" for={`min_${props.featureIndex}`}>
                <Text id="integration.mqtt.feature.minLabel" />
              </label>
              <Localizer>
                <input
                  id={`min_${props.featureIndex}`}
                  type="number"
                  value={props.feature.min}
                  onChange={this.updateFeatureMinValue}
                  class="form-control"
                  placeholder={<Text id="integration.mqtt.feature.minPlaceholder" />}
                />
              </Localizer>
            </div>
            <div class="form-group">
              <label class="form-label" for={`max_${props.featureIndex}`}>
                <Text id="integration.mqtt.feature.maxLabel" />
              </label>
              <Localizer>
                <input
                  id={`max_${props.featureIndex}`}
                  type="number"
                  value={props.feature.max}
                  onChange={this.updateFeatureMaxValue}
                  class="form-control"
                  placeholder={<Text id="integration.mqtt.feature.maxPlaceholder" />}
                />
              </Localizer>
            </div>

            <div class="form-group">
              <button onClick={this.deleteFeature} class="btn btn-outline-danger">
                <Text id="integration.mqtt.feature.deleteLabel" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default MqttFeatureBox;
