import { Text, MarkupText, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import get from 'get-value';

import {
  DEVICE_FEATURE_UNITS_BY_CATEGORY,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES
} from '../../../../../../../../server/utils/constants';
import { ENERGY_INDEX_FEATURE_TYPES } from '../../../../../../../../server/services/energy-monitoring/utils/constants';
import { DeviceFeatureCategoriesIcon } from '../../../../../../utils/consts';
import { getDeviceParam } from '../../../../../../utils/device';
import { featureNeedsMinMax } from '../utils';
import style from '../style.css';

const MqttFeatureBox = ({ children, feature, featureIndex, ...props }) => {
  const icon = get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`, 'radio');
  const featureLabel = feature.name || <Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`} />;
  const showMinMax = featureNeedsMinMax(feature.category, feature.type);

  return (
    <div class={cx(style.featureAccordion, { [style.featureAccordionExpanded]: props.isExpanded })}>
      <button type="button" class={style.featureAccordionHeader} onClick={props.toggleExpanded}>
        <i class={cx('fe', props.isExpanded ? 'fe-chevron-down' : 'fe-chevron-right')} />
        <i class={`fe fe-${icon} ${style.featureAccordionIcon}`} />
        <div class={style.featureAccordionTitle}>
          <span class={style.featureAccordionName}>{featureLabel}</span>
          <span class={style.featureAccordionType}>
            <Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`} />
          </span>
        </div>
        <div class={style.featureAccordionBadges}>
          {feature.read_only ? (
            <span class="badge badge-info" title="">
              <i class="fe fe-activity mr-1" />
              <Text id="integration.mqtt.featureCatalog.sensorBadge" />
            </span>
          ) : (
            <span class="badge badge-primary">
              <i class="fe fe-sliders mr-1" />
              <Text id="integration.mqtt.featureCatalog.actuatorBadge" />
            </span>
          )}
          {feature.keep_history && feature.category !== DEVICE_FEATURE_CATEGORIES.TEXT && (
            <span class="badge badge-secondary">
              <i class="fe fe-bar-chart-2 mr-1" />
              <Text id="integration.mqtt.featureCatalog.historyBadge" />
            </span>
          )}
        </div>
      </button>

      {props.isExpanded && (
        <div class={style.featureAccordionBody}>
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label class="form-label" for={`featureName_${featureIndex}`}>
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
            </div>
            <div class="col-md-6">
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
            </div>
          </div>

          <div class="row">
            {DEVICE_FEATURE_UNITS_BY_CATEGORY[feature.category] && (
              <div class="col-md-4">
                <div class="form-group">
                  <label class="form-label" for={`unit_${featureIndex}`}>
                    <Text id="editDeviceForm.unitLabel" />
                  </label>
                  <Localizer>
                    <select
                      id={`unit_${featureIndex}`}
                      value={feature.unit || ''}
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
              </div>
            )}

            <div class="col-md-4">
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
            </div>

            {feature.category !== DEVICE_FEATURE_CATEGORIES.TEXT && (
              <div class="col-md-4">
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
                </div>
              </div>
            )}
          </div>

          <div class="form-group">
            <button type="button" onClick={props.toggleAdvancedSettings} class="btn btn-outline-secondary btn-sm">
              {props.showAdvancedSettings ? (
                <Text id="integration.mqtt.feature.hideAdvancedSettings" />
              ) : (
                <Text id="integration.mqtt.feature.showAdvancedSettings" />
              )}
            </button>
          </div>

          {props.showAdvancedSettings && (
            <div class={style.featureAdvancedSection}>
              {showMinMax && (
                <div class="row">
                  <div class="col-md-6">
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
                  </div>
                  <div class="col-md-6">
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
                  </div>
                </div>
              )}

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
            </div>
          )}

          {props.showCreateEnergyFeaturesButton && (
            <div class="alert alert-info">
              <h4>
                <Text id="integration.mqtt.feature.energyMonitoring.title" />
              </h4>
              <p>
                <Text id="integration.mqtt.feature.energyMonitoring.description" />
              </p>
              <button onClick={props.createEnergyConsumptionFeatures} class="btn btn-primary">
                <Text id="integration.mqtt.feature.energyMonitoring.createButton" />
              </button>
            </div>
          )}

          <div class="form-group mb-0">
            <button onClick={props.deleteFeature} class="btn btn-outline-danger btn-sm">
              <Text id="integration.mqtt.feature.deleteLabel" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

class MqttFeatureBoxComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isExpanded: props.initiallyExpanded || false,
      showAdvancedSettings: false
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.initiallyExpanded && !this.props.initiallyExpanded) {
      this.setState({ isExpanded: true });
    }
  }

  toggleExpanded = () => {
    this.setState({ isExpanded: !this.state.isExpanded });
  };

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
  isEnergyIndexFeature = () => {
    const { feature } = this.props;
    const categoryTypes = ENERGY_INDEX_FEATURE_TYPES[feature.category];
    return categoryTypes && categoryTypes.includes(feature.type);
  };
  hasEnergyConsumptionFeatures = () => {
    const { device, feature } = this.props;
    if (!device || !device.features) return false;

    const hasConsumption = device.features.some(
      f => f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION && f.energy_parent_id === feature.id
    );

    return hasConsumption;
  };
  createEnergyConsumptionFeatures = () => {
    this.props.createEnergyConsumptionFeatures(this.props.featureIndex);
  };
  toggleAdvancedSettings = () => {
    this.setState({ showAdvancedSettings: !this.state.showAdvancedSettings });
  };
  render() {
    const { publishMqttTopic, listenMqttTopic } = this.getMqttTopic();
    const mqttCustomTopic = this.getCustomMqttTopicValue();
    const mqttCustomObjectPath = this.getCustomMqttObjectPathValue();
    const isEnergyIndex = this.isEnergyIndexFeature();
    const hasConsumptionFeatures = this.hasEnergyConsumptionFeatures();
    const showCreateEnergyFeaturesButton = isEnergyIndex && !hasConsumptionFeatures;
    return (
      <MqttFeatureBox
        {...this.props}
        isExpanded={this.state.isExpanded}
        toggleExpanded={this.toggleExpanded}
        showAdvancedSettings={this.state.showAdvancedSettings}
        toggleAdvancedSettings={this.toggleAdvancedSettings}
        updateName={this.updateName}
        updateExternalId={this.updateExternalId}
        updateMin={this.updateMin}
        updateMax={this.updateMax}
        updateUnit={this.updateUnit}
        updateReadOnly={this.updateReadOnly}
        updateKeepHistory={this.updateKeepHistory}
        deleteFeature={this.deleteFeature}
        publishMqttTopic={publishMqttTopic}
        listenMqttTopic={listenMqttTopic}
        mqttCustomTopic={mqttCustomTopic}
        mqttCustomObjectPath={mqttCustomObjectPath}
        updateMqttCustomTopic={this.updateMqttCustomTopic}
        updateMqttCustomObjectPath={this.updateMqttCustomObjectPath}
        showCreateEnergyFeaturesButton={showCreateEnergyFeaturesButton}
        createEnergyConsumptionFeatures={this.createEnergyConsumptionFeatures}
      />
    );
  }
}

export default MqttFeatureBoxComponent;
