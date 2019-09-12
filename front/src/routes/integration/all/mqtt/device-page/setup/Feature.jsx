import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_UNITS } from '../../../../../../../../server/utils/constants';
import { DeviceFeatureCategoriesIcon } from '../../../../../../utils/consts';
import get from 'get-value';

const MqttFeatureBox = ({ children, ...props }) => {
  return (
    <div class="col-md-6">
      <div class="card">
        <div class="card-header">
          <i
            class={`mr-2 fe fe-${get(DeviceFeatureCategoriesIcon, `${props.feature.category}.${props.feature.type}`)}`}
          />
          <Text id={`deviceFeatureCategory.${props.feature.category}.${props.feature.type}`} />
        </div>
        <div class="card-body">
          <div class="form-group form-label" for={`featureName_${props.featureIndex}`}>
            <label>
              <Text id="integration.mqtt.feature.nameLabel" />
            </label>
            <Localizer>
              <input
                id={`featureName_${props.featureIndex}`}
                type="text"
                value={props.feature.name}
                onInput={props.updateName}
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
                onInput={props.updateExternalId}
                class="form-control"
                placeholder={<Text id="integration.mqtt.feature.externalIdPlaceholder" />}
              />
            </Localizer>
          </div>

          {props.feature.category === DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR && (
            <div class="form-group">
              <label class="form-label" for={`externalid_${props.featureIndex}`}>
                <Text id="integration.mqtt.feature.unitLabel" />
              </label>
              <Localizer>
                <select
                  id={`unit_${props.featureIndex}`}
                  type="text"
                  value={props.feature.unit}
                  onChange={props.updateUnit}
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

          <div class="form-group">
            <label class="form-label" for={`min_${props.featureIndex}`}>
              <Text id="integration.mqtt.feature.minLabel" />
            </label>
            <Localizer>
              <input
                id={`min_${props.featureIndex}`}
                type="number"
                value={props.feature.min}
                onInput={props.updateMin}
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
                onInput={props.updateMax}
                class="form-control"
                placeholder={<Text id="integration.mqtt.feature.maxPlaceholder" />}
              />
            </Localizer>
          </div>

          <div class="form-group">
            <button onClick={props.deleteFeature} class="btn btn-outline-danger">
              <Text id="integration.mqtt.feature.deleteLabel" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

class MqttFeatureBoxComponent extends Component {
  updateName = e => {
    this.props.updateFeatureProperty(e, 'name', this.props.featureIndex);
  };
  updateExternalId = e => {
    this.props.updateFeatureProperty(e, 'external_id', this.props.featureIndex);
  };
  updateMin = e => {
    this.props.updateFeatureProperty(e, 'min', this.props.featureIndex);
  };
  updateMax = e => {
    this.props.updateFeatureProperty(e, 'max', this.props.featureIndex);
  };
  updateUnit = e => {
    this.props.updateFeatureProperty(e, 'unit', this.props.featureIndex);
  };
  deleteFeature = () => {
    this.props.deleteFeature(this.props.featureIndex);
  };
  render() {
    return (
      <MqttFeatureBox
        {...this.props}
        updateName={this.updateName}
        updateExternalId={this.updateExternalId}
        updateMin={this.updateMin}
        updateMax={this.updateMax}
        updateUnit={this.updateUnit}
        deleteFeature={this.deleteFeature}
      />
    );
  }
}

export default MqttFeatureBoxComponent;
