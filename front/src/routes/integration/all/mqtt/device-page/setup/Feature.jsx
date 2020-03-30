import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_UNITS } from '../../../../../../../../server/utils/constants';
import { DeviceFeatureCategoriesIcon, RequestStatus } from '../../../../../../utils/consts';
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

          {props.feature.category === DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR && (
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
                  <option value={DEVICE_FEATURE_UNITS.PERCENT}>
                    <Text id="deviceFeatureUnit.percent" />
                  </option>
                </select>
              </Localizer>
            </div>
          )}

          {props.feature.category === DEVICE_FEATURE_CATEGORIES.CO2_SENSOR && (
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
                  <option value={DEVICE_FEATURE_UNITS.PPM}>
                    <Text id="deviceFeatureUnit.ppm" />
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
            <div class="form-label">
              <Text id="integration.mqtt.feature.readOnlyLabel" />
            </div>
            <label class="custom-switch">
              <input
                type="checkbox"
                name={`read_only_${props.featureIndex}`}
                checked={props.feature.read_only}
                onClick={props.updateReadOnly}
                class="custom-switch-input"
              />
              <span class="custom-switch-indicator" />
              <span class="custom-switch-description">
                <Text id="integration.mqtt.feature.readOnlyLabel" />
              </span>
            </label>
          </div>

          <div class="form-group">
            <label class="form-label">
              <Text id="integration.mqtt.feature.mqttTopicExampleLabel" />
            </label>

            <pre>
              <code>{props.mqttTopic}</code>
            </pre>
          </div>

          <div class="form-group">
            <button onClick={props.copyMqttTopic} class="btn btn-outline-info mr-2">
              {!props.clipboardCopiedStatus && <Text id="integration.mqtt.feature.copyMqttTopic" />}
              {props.clipboardCopiedStatus === RequestStatus.Success && <Text id="integration.mqtt.feature.copied" />}
              {props.clipboardCopiedStatus === RequestStatus.Error && <Text id="integration.mqtt.feature.copyFailed" />}
            </button>

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
  updateReadOnly = () => {
    const e = {
      target: {
        value: !this.props.feature.read_only
      }
    };
    this.props.updateFeatureProperty(e, 'read_only', this.props.featureIndex);
  };
  deleteFeature = () => {
    this.props.deleteFeature(this.props.featureIndex);
  };
  getMqttTopic = () => {
    if (this.props.feature.read_only) {
      return `gladys/master/device/${this.props.device.external_id}/feature/${this.props.feature.external_id}/state`;
    }
    return `gladys/device/${this.props.device.external_id}/feature/${this.props.feature.external_id}/state`;
  };
  copyMqttTopic = async () => {
    try {
      this.setState({ clipboardCopiedStatus: RequestStatus.Getting });
      await navigator.clipboard.writeText(this.getMqttTopic());
      this.setState({ clipboardCopiedStatus: RequestStatus.Success });
      setTimeout(() => this.setState({ clipboardCopiedStatus: null }), 2000);
    } catch (e) {
      this.setState({ clipboardCopiedStatus: RequestStatus.Error });
    }
  };
  render() {
    const mqttTopic = this.getMqttTopic();
    return (
      <MqttFeatureBox
        {...this.props}
        clipboardCopiedStatus={this.state.clipboardCopiedStatus}
        updateName={this.updateName}
        updateExternalId={this.updateExternalId}
        updateMin={this.updateMin}
        updateMax={this.updateMax}
        updateUnit={this.updateUnit}
        updateReadOnly={this.updateReadOnly}
        deleteFeature={this.deleteFeature}
        copyMqttTopic={this.copyMqttTopic}
        mqttTopic={mqttTopic}
      />
    );
  }
}

export default MqttFeatureBoxComponent;
