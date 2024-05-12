import { Text, Localizer, MarkupText } from 'preact-i18n';
import { Component } from 'preact';
import {
  DEVICE_FEATURE_UNITS_BY_CATEGORY,
  DEVICE_FEATURE_CATEGORIES
} from '../../../../../../../../server/utils/constants';
import { DeviceFeatureCategoriesIcon, RequestStatus } from '../../../../../../utils/consts';
import { getDeviceParam } from '../../../../../../utils/device';
import get from 'get-value';

const MqttFeatureBox = ({ children, feature, featureIndex, ...props }) => {
  return (
    <div class="col-md-6">
      <div class="card">
        <div class="card-header">
          <i class={`mr-2 fe fe-${get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`)}`} />
          <Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`} />
        </div>
        <div class="card-body">
          <div class="form-group form-label" for={`featureName_${featureIndex}`}>
            <label>
              <Text id="integration.mqtt.feature.nameLabel" />
            </label>
            <Localizer>
              <input
                id={`featureName_${featureIndex}`}
                type="text"
                value={feature.name}
                onInput={props.updateName}
                class="form-control"
                placeholder={<Text id="integration.mqtt.feature.namePlaceholder" />}
              />
            </Localizer>
          </div>

          <div class="form-group">
            <label class="form-label" for={`externalid_${featureIndex}`}>
              <Text id="integration.mqtt.feature.externalIdLabel" />
            </label>
            <Localizer>
              <input
                id={`externalid_${featureIndex}`}
                type="text"
                value={feature.external_id}
                onInput={props.updateExternalId}
                class="form-control"
                placeholder={<Text id="integration.mqtt.feature.externalIdPlaceholder" />}
              />
            </Localizer>
          </div>

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
                  onChange={props.updateUnit}
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

          {feature.category !== DEVICE_FEATURE_CATEGORIES.TEXT && (
            <div class="form-group">
              <label class="form-label" for={`min_${featureIndex}`}>
                <Text id="integration.mqtt.feature.minLabel" />
              </label>
              <Localizer>
                <input
                  id={`min_${featureIndex}`}
                  type="number"
                  value={feature.min}
                  onInput={props.updateMin}
                  class="form-control"
                  placeholder={<Text id="integration.mqtt.feature.minPlaceholder" />}
                />
              </Localizer>
            </div>
          )}
          {feature.category !== DEVICE_FEATURE_CATEGORIES.TEXT && (
            <div class="form-group">
              <label class="form-label" for={`max_${featureIndex}`}>
                <Text id="integration.mqtt.feature.maxLabel" />
              </label>
              <Localizer>
                <input
                  id={`max_${featureIndex}`}
                  type="number"
                  value={feature.max}
                  onInput={props.updateMax}
                  class="form-control"
                  placeholder={<Text id="integration.mqtt.feature.maxPlaceholder" />}
                />
              </Localizer>
            </div>
          )}
          {feature.category !== DEVICE_FEATURE_CATEGORIES.TEXT && (
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
                    onClick={props.updateKeepHistory}
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
          )}
          <div class="form-group">
            <div class="form-label">
              <Text id="integration.mqtt.feature.readOnlyLabel" />
            </div>
            <label class="custom-switch">
              <input
                type="checkbox"
                name={`read_only_${featureIndex}`}
                checked={feature.read_only}
                onClick={props.updateReadOnly}
                class="custom-switch-input"
              />
              <span class="custom-switch-indicator" />
              <span class="custom-switch-description">
                <Text id="integration.mqtt.feature.readOnlyButton" />
              </span>
            </label>
          </div>

          <div class="form-group">
            <label class="form-label">
              <Text id="integration.mqtt.feature.mqttTopicToPublishExampleLabel" />
            </label>
            <p>
              <small>
                <MarkupText id="integration.mqtt.feature.mqttTopicToPublishExampleDescription" />
              </small>
            </p>
            <pre>
              <code>{props.publishMqttTopic}</code>
            </pre>
          </div>

          <div class="form-group">
            <label class="form-label">
              <Text id="integration.mqtt.feature.mqttCustomTopic" />
            </label>
            <p>
              <small>
                <MarkupText id="integration.mqtt.feature.mqttCustomTopicDescription" />
              </small>
            </p>
            <Localizer>
              <input
                type="text"
                value={props.mqttCustomTopic}
                onInput={props.updateMqttCustomTopic}
                class="form-control"
                placeholder={<Text id="integration.mqtt.feature.mqttCustomTopicPlaceholder" />}
              />
            </Localizer>
          </div>

          <div class="form-group">
            <label class="form-label">
              <Text id="integration.mqtt.feature.mqttCustomObjectPath" />
            </label>
            <p>
              <small>
                <MarkupText id="integration.mqtt.feature.mqttCustomObjectPathDescription" />
              </small>
            </p>
            <Localizer>
              <input
                type="text"
                value={props.mqttCustomObjectPath}
                onInput={props.updateMqttCustomObjectPath}
                class="form-control"
                placeholder={<Text id="integration.mqtt.feature.mqttCustomObjectPathPlaceholder" />}
              />
            </Localizer>
          </div>

          {feature.read_only === false && (
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.mqtt.feature.mqttTopicToListenExampleLabel" />
              </label>
              <p>
                <small>
                  <MarkupText id="integration.mqtt.feature.mqttTopicToListenExampleDescription" />
                </small>
              </p>
              <pre>
                <code>{props.listenMqttTopic}</code>
              </pre>
            </div>
          )}

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
  updateReadOnly = () => {
    const e = {
      target: {
        value: !this.props.feature.read_only
      }
    };
    this.props.updateFeatureProperty(e, 'read_only', this.props.featureIndex);
  };
  updateKeepHistory = () => {
    const e = {
      target: {
        value: !this.props.feature.keep_history
      }
    };
    this.props.updateFeatureProperty(e, 'keep_history', this.props.featureIndex);
  };
  getCustomMqttTopicParamPrefix = () => {
    return `mqtt_custom_topic_feature:${this.props.feature.id}`;
  };
  getCustomMqttObjectPathParamPrefix = () => {
    return `mqtt_custom_object_path_feature:${this.props.feature.id}`;
  };
  getCustomMqttTopicValue = () => {
    return getDeviceParam(this.props.device, this.getCustomMqttTopicParamPrefix());
  };
  getCustomMqttObjectPathValue = () => {
    return getDeviceParam(this.props.device, this.getCustomMqttObjectPathParamPrefix());
  };
  updateMqttCustomTopic = e => {
    this.props.updateDeviceParam(this.getCustomMqttTopicParamPrefix(), e.target.value);
  };
  updateMqttCustomObjectPath = e => {
    this.props.updateDeviceParam(this.getCustomMqttObjectPathParamPrefix(), e.target.value);
  };
  deleteFeature = () => {
    this.props.deleteFeature(this.props.featureIndex);
  };
  getMqttTopic = () => {
    let publishMqttTopic;
    if (this.props.feature.category === DEVICE_FEATURE_CATEGORIES.TEXT) {
      publishMqttTopic = `gladys/master/device/${this.props.device.external_id}/feature/${this.props.feature.external_id}/text`;
    } else {
      publishMqttTopic = `gladys/master/device/${this.props.device.external_id}/feature/${this.props.feature.external_id}/state`;
    }

    const listenMqttTopic = `gladys/device/${this.props.device.external_id}/feature/${this.props.feature.external_id}/state`;
    return {
      publishMqttTopic,
      listenMqttTopic
    };
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
    const { publishMqttTopic, listenMqttTopic } = this.getMqttTopic();
    const mqttCustomTopic = this.getCustomMqttTopicValue();
    const mqttCustomObjectPath = this.getCustomMqttObjectPathValue();
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
        updateKeepHistory={this.updateKeepHistory}
        deleteFeature={this.deleteFeature}
        copyMqttTopic={this.copyMqttTopic}
        publishMqttTopic={publishMqttTopic}
        listenMqttTopic={listenMqttTopic}
        mqttCustomTopic={mqttCustomTopic}
        mqttCustomObjectPath={mqttCustomObjectPath}
        updateMqttCustomTopic={this.updateMqttCustomTopic}
        updateMqttCustomObjectPath={this.updateMqttCustomObjectPath}
      />
    );
  }
}

export default MqttFeatureBoxComponent;
