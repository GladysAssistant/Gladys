import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import { DeviceFeatureCategoriesIcon } from '../../../../../../utils/consts';
import get from 'get-value';

class MqttFeatureBox extends Component {
  render({ ...props }) {
    return (
      <div class="col-md-6">
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
            <div class="form-group" class="form-label" for={`featueName_${props.featureIndex}`}>
              <label>
                <Text id="integration.mqtt.feature.nameLabel" />
              </label>
              <Localizer>
                <input
                  id={`featueName_${props.featureIndex}`}
                  type="text"
                  value={props.feature.name}
                  onChange={e => props.updateFeatureProperty(e, 'name', props.featureIndex)}
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
                  onChange={e => props.updateFeatureProperty(e, 'external_id', props.featureIndex)}
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
                  onChange={e => props.updateFeatureProperty(e, 'min', props.featureIndex)}
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
                  onChange={e => props.updateFeatureProperty(e, 'max', props.featureIndex)}
                  class="form-control"
                  placeholder={<Text id="integration.mqtt.feature.maxPlaceholder" />}
                />
              </Localizer>
            </div>

            <div class="form-group">
              <button onClick={() => props.deleteFeature(props.featureIndex)} class="btn btn-outline-danger">
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
