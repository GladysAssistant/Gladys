import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_UNITS } from '../../../../../../../../server/utils/constants';
import { DeviceFeatureCategoriesIcon } from '../../../../../../utils/consts';
import get from 'get-value';

const RflinkFeatureBox = ({ children, ...props }) => {
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
              <Text id="integration.rflink.feature.nameLabel" />
            </label>
            <Localizer>
              <input
                id={`featureName_${props.featureIndex}`}
                type="text"
                value={props.feature.name}
                onInput={props.updateName}
                class="form-control"
                placeholder={<Text id="integration.rflink.feature.namePlaceholder" />}
              />
            </Localizer>
          </div>

          <div>
            <div class="form-group">
              <label class="form-label" for={`switchid_${props.featureIndex}`}>
                <Text id="integration.rflink.feature.switchIdLabel" />
              </label>
              <Localizer>
                <input
                  id={`switchid_${props.featureIndex}`}
                  type="text"
                  value={props.feature.switchId}
                  onInput={props.updateSwitchId}
                  class="form-control"
                  placeholder={<Text id="integration.rflink.feature.switchIdPlaceholder" />}
                />
              </Localizer>
            </div>
          </div>

          {(props.feature.read_only === false || props.feature.read_only === undefined) && ( // Switch
            <div class="form-group">
              <label class="form-label" for={`switchnumber_${props.featureIndex}`}>
                <Text id="integration.rflink.feature.switchNumberLabel" />
              </label>
              <Localizer>
                <input
                  id={`switchnumber_${props.featureIndex}`}
                  type="text"
                  value={props.feature.switchNumber}
                  onInput={props.updateSwitchNumber}
                  class="form-control"
                  placeholder={<Text id="integration.rflink.feature.switchNumberPlaceholder" />}
                />
              </Localizer>
            </div>
          )}

          {props.feature.category === DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR && (
            <div class="form-group">
              <label class="form-label" for={`externalid_${props.featureIndex}`}>
                <Text id="integration.rflink.feature.unitLabel" />
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
          <div>
            <div class="form-group">
              <label class="form-label" for={`min_${props.featureIndex}`}>
                <Text id="integration.rflink.feature.minLabel" />
              </label>
              <Localizer>
                <input
                  id={`min_${props.featureIndex}`}
                  type="number"
                  value={props.feature.min}
                  onInput={props.updateMin}
                  class="form-control"
                  placeholder={<Text id="integration.rflink.feature.minPlaceholder" />}
                />
              </Localizer>
            </div>
            <div class="form-group">
              <label class="form-label" for={`max_${props.featureIndex}`}>
                <Text id="integration.rflink.feature.maxLabel" />
              </label>
              <Localizer>
                <input
                  id={`max_${props.featureIndex}`}
                  type="number"
                  value={props.feature.max}
                  onInput={props.updateMax}
                  class="form-control"
                  placeholder={<Text id="integration.rflink.feature.maxPlaceholder" />}
                />
              </Localizer>
            </div>
          </div>

          <div class="form-group">
            <button onClick={props.deleteFeature} class="btn btn-outline-danger">
              <Text id="integration.rflink.feature.deleteLabel" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

class RflinkFeatureBoxComponent extends Component {
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
  updateSwitchId = e => {
    this.props.feature.switchId = e.target.value;
    let external = {
      target: {
        value: ''
      }
    };
    external.target.value = `rflink:${e.target.value}:switch:${this.props.feature.switchNumber}`;
    this.updateExternalId(external);
  };
  updateSwitchNumber = e => {
    this.props.feature.switchNumber = e.target.value;
    let external = {
      target: {
        value: ''
      }
    };
    external.target.value = `rflink:${this.props.feature.switchId}:switch:${e.target.value}`;
    this.updateExternalId(external);
  };

  deleteFeature = () => {
    this.props.deleteFeature(this.props.featureIndex);
  };
  render() {
    return (
      <RflinkFeatureBox
        {...this.props}
        updateName={this.updateName}
        updateExternalId={this.updateExternalId}
        updateMin={this.updateMin}
        updateMax={this.updateMax}
        updateUnit={this.updateUnit}
        updateSwitchId={this.updateSwitchId}
        updateSwitchNumber={this.updateSwitchNumber}
        deleteFeature={this.deleteFeature}
      />
    );
  }
}

export default RflinkFeatureBoxComponent;
