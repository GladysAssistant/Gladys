import { Text, MarkupText } from 'preact-i18n';
import { Link } from 'preact-router/match';

import Feature from './Feature';
import { RequestStatus, DeviceFeatureCategoriesIcon } from '../../../../../../utils/consts';
import { DEVICE_FEATURE_CATEGORIES_LIST } from '../../../../../../../../server/utils/constants';

import MqttDeviceForm from '../DeviceForm';
import cx from 'classnames';
import Select from '../../../../../../components/form/Select';

const FeatureTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <Link href="/dashboard/integration/device/mqtt">
        <button class="btn btn-secondary mr-2">
          <Text id="global.backButton" />
        </button>
      </Link>
      <h3 class="card-title">
        {(props.device && props.device.name) || <Text id="integration.mqtt.device.noNameLabel" />}
      </h3>
    </div>
    <div
      class={cx('dimmer', {
        active: props.loading
      })}
    >
      <div class="loader" />
      <div class="dimmer-content">
        <div class="card-body">
          <div class="alert alert-secondary">
            <MarkupText id="integration.mqtt.feature.externalIdMessage" />
          </div>
          {props.saveStatus === RequestStatus.Error && (
            <div class="alert alert-danger">
              <Text id="integration.mqtt.device.saveError" />
            </div>
          )}
          {props.saveStatus === RequestStatus.ConflictError && (
            <div class="alert alert-danger">
              <Text id="integration.mqtt.device.saveConflictError" />
            </div>
          )}
          {!props.loading && !props.device && (
            <div>
              <p class="alert alert-danger">
                <Text id="integration.mqtt.device.notFound" />
              </p>
              <Link href="/dashboard/integration/device/mqtt">
                <button type="button" class="btn btn-outline-secondary btn-sm">
                  <Text id="integration.mqtt.device.backToList" />
                </button>
              </Link>
            </div>
          )}
          {props.device && (
            <div>
              <MqttDeviceForm {...props} />

              <div class="form-group form-inline">
                <Select
                  searchable
                  value={props.selectedFeature}
                  uniqueKey="value"
                  onChange={props.selectFeature}
                  options={DEVICE_FEATURE_CATEGORIES_LIST.flatMap(category =>
                    Object.keys(DeviceFeatureCategoriesIcon[category]).map(type => {
                      return {
                        value: `${category}|${type}`,
                        label: <Text id={`deviceFeatureCategory.${category}.${type}`} />
                      };
                    })
                  )}
                />
                <button
                  onClick={props.addFeature}
                  class="btn btn-outline-success ml-2"
                  disabled={!props.selectedFeature}
                >
                  <Text id="integration.mqtt.feature.addButton" />
                </button>
              </div>

              <div class="row">
                {props.device &&
                  props.device.features.map((feature, index) => (
                    <Feature {...props} feature={feature} featureIndex={index} />
                  ))}
              </div>

              <div class="form-group">
                <Link href="/dashboard/integration/device/mqtt">
                  <button class="btn btn-secondary mr-2">
                    <Text id="global.backButton" />
                  </button>
                </Link>
                <button onClick={props.saveDevice} class="btn btn-success mr-2">
                  <Text id="integration.mqtt.device.saveButton" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default FeatureTab;
