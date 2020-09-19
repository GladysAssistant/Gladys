import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';
import { DeviceFeatureCategoriesIcon } from '../../../../../../utils/consts';
import cx from 'classnames';

class ConfigurePeripheralInput extends Component {
  updateFeatureName = event => {
    this.props.updateFeatureName(event, this.props.index);
  };

  render({ feature, index, disableForm }) {
    return (
      <li class="form-group">
        <div
          class={cx('input-group mb-2', {
            'was-validated': !feature.name || feature.name.length === 0
          })}
        >
          <div class="input-group-prepend">
            <div class="tag input-group-text">
              <Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`} />
              <div class="tag-addon">
                <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`)}`} />
              </div>
            </div>
          </div>
          <Localizer>
            <input
              class="form-control form-control-sm"
              placeholder={<Text id="integration.bluetooth.device.featureNamePlaceholder" />}
              value={feature.name}
              disabled={disableForm}
              key={`feature-${index}`}
              onChange={this.updateFeatureName}
              required
            />
          </Localizer>
        </div>
      </li>
    );
  }
}

export default ConfigurePeripheralInput;
