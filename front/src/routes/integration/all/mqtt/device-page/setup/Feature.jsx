import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';

class MqttFeatureBox extends Component {
  updateFeatureName(e) {
    this.props.updateFeatureProperty(this.props.deviceIndex, this.props.featureIndex, 'name', e.target.value);
  }

  updateFeatureExternalId(e) {
    this.props.updateFeatureProperty(this.props.deviceIndex, this.props.featureIndex, 'external_id', e.target.value);
  }

  deleteFeature() {
    this.props.deleteFeature(this.props.deviceIndex, this.props.featureIndex);
  }

  constructor(props) {
    super(props);

    this.updateFeatureName = this.updateFeatureName.bind(this);
    this.updateFeatureExternalId = this.updateFeatureExternalId.bind(this);
    this.deleteFeature = this.deleteFeature.bind(this);
  }

  render({ ...props }) {
    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <Text id={`deviceFeatureCategory.${props.feature.category}`} />
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
