import { Text } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import get from 'get-value';

import { DeviceFeatureCategoriesIcon } from '../../../../../utils/consts';

import { PARAMS } from '../../../../../../../server/services/bluetooth/lib/utils/bluetooth.constants';

import style from '../style.css';

class BluetoothPeripheralFeatures extends Component {
  scan = () => {
    this.props.scan(this.props.peripheral.selector);
  };

  render({ children, peripheral, bluetoothStatus }) {
    const params = peripheral.params || [];
    const loadedParam = params.find(p => p.name === PARAMS.LOADED);
    const loadedValue = (loadedParam || { value: false }).value;

    return (
      <div class="form-group">
        <label>
          <Text id="integration.bluetooth.device.featuresLabel" />
        </label>
        <div class="row mb-3">
          <button
            type="button"
            class="btn btn-sm btn-outline-primary mx-auto"
            disabled={bluetoothStatus.scanning || bluetoothStatus.peripheralLookup}
            onClick={this.scan}
          >
            <Text id="integration.bluetooth.setup.reloadButton" />
          </button>
        </div>
        <div class={cx('dimmer', { active: !loadedValue && loadedParam })}>
          <div class={cx('dimmer-content', style.featureListBody)}>
            {loadedParam && (!peripheral.features || peripheral.features.length === 0) && (
              <div class="text-center font-italic">
                <Text id="integration.bluetooth.device.noFeatureDiscovered" />
              </div>
            )}
            {loadedParam &&
              peripheral.features &&
              (children || (
                <div class="tags">
                  {peripheral.features.map(feature => (
                    <span class="tag">
                      <Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`} />
                      <div class="tag-addon">
                        <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`)}`} />
                      </div>
                    </span>
                  ))}
                </div>
              ))}
          </div>
          <div class="loader" />
        </div>
      </div>
    );
  }
}

export default BluetoothPeripheralFeatures;
