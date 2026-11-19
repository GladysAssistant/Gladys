import { Text, MarkupText } from 'preact-i18n';
import { Component } from 'preact';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import get from 'get-value';

import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../../server/utils/constants';
import BatteryLevelFeature from '../../../../../components/device/view/BatteryLevelFeature';
import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';
import { MobileDeviceItem, BatteryPill } from '../../../../../components/integration/mobile';
import DeleteDeviceButton from '../../../../../components/device/DeleteDeviceButton';

class DeviceListItem extends Component {
  // resolves to false when the device could not be deleted (the phone sheet then says so)
  deleteDevice = async () => {
    this.setState({ loading: true, tooMuchStatesError: false, statesNumber: undefined });
    let deleted = true;
    try {
      await this.props.deleteDevice(this.props.device, this.props.deviceIndex);
    } catch (e) {
      deleted = false;
      const status = get(e, 'response.status');
      const dataMessage = get(e, 'response.data.message');
      if (status === 400 && dataMessage && dataMessage.includes('Too much states')) {
        const statesNumber = new Intl.NumberFormat().format(dataMessage.split(' ')[0]);
        this.setState({ tooMuchStatesError: true, statesNumber });
      } else {
        this.setState({ error: RequestStatus.Error });
      }
    }
    this.setState({ loading: false });
    return deleted;
  };

  getBatteryLevel = () => {
    if (!this.props.device.features) {
      return null;
    }
    const batteryFeature = this.props.device.features.find(
      feature => feature.category === DEVICE_FEATURE_CATEGORIES.BATTERY
    );
    return get(batteryFeature, 'last_value');
  };

  render(props, { loading, tooMuchStatesError, statesNumber, error }) {
    const batteryLevel = this.getBatteryLevel();
    const featureCount = props.device.features ? props.device.features.length : 0;

    // On a phone: a row and its sheet (docs/specs/mobile-pages/integration-devices.md). A device
    // is edited in its own page, as from the list of a wider screen.
    if (props.isMobile) {
      let deleteError = null;
      if (tooMuchStatesError) {
        deleteError = <MarkupText id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />;
      } else if (error) {
        deleteError = <Text id="integration.mqtt.device.saveError" />;
      }
      return (
        <MobileDeviceItem
          device={props.device}
          title={props.device.name || <Text id="integration.mqtt.device.noNameLabel" />}
          subtitle={<Text id="integration.mqtt.device.featureCount" fields={{ count: featureCount }} />}
          pills={batteryLevel !== null && batteryLevel !== undefined ? <BatteryPill level={batteryLevel} /> : null}
          details={[
            {
              label: <Text id="integration.mqtt.device.externalIdLabel" />,
              value: props.device.external_id,
              mono: true
            }
          ]}
          primaryAction={{
            label: <Text id="integration.mqtt.device.editButton" />,
            icon: 'edit-2',
            href: `/dashboard/integration/device/mqtt/edit/${props.device.selector}`,
            dataCy: 'mqtt-device-edit'
          }}
          onDelete={this.deleteDevice}
          deleteError={deleteError}
          dataCy="mqtt-device-row"
        />
      );
    }

    return (
      <div class={cx(style.deviceListItem, { [style.deviceListItemLoading]: loading })}>
        <div class={style.deviceListItemMain}>
          <Link
            href={`/dashboard/integration/device/mqtt/edit/${props.device.selector}`}
            class={style.deviceListItemLink}
          >
            <span class={style.deviceListItemName}>
              {props.device.name || <Text id="integration.mqtt.device.noNameLabel" />}
            </span>
          </Link>
          <div class={style.deviceListItemMeta}>
            <span class="text-muted">
              <Text id="integration.mqtt.device.featureCount" fields={{ count: featureCount }} />
            </span>
            {batteryLevel !== null && batteryLevel !== undefined && <BatteryLevelFeature batteryLevel={batteryLevel} />}
          </div>
        </div>

        <div class={style.deviceListItemFeatures}>
          <DeviceFeatures features={props.device.features} />
        </div>

        <div class={style.deviceListItemActions}>
          <Link
            href={`/dashboard/integration/device/mqtt/edit/${props.device.selector}`}
            class="btn btn-outline-primary btn-sm"
          >
            <Text id="integration.mqtt.device.editButton" />
          </Link>
          <DeleteDeviceButton
            device={props.device}
            onDelete={this.deleteDevice}
            class="btn btn-outline-danger btn-sm"
            disabled={loading}
          >
            <Text id="integration.mqtt.device.deleteButton" />
          </DeleteDeviceButton>
        </div>

        {tooMuchStatesError && (
          <div class={cx('alert alert-warning mt-2 mb-0', style.deviceListItemAlert)}>
            <MarkupText id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />
          </div>
        )}
        {error && (
          <div class={cx('alert alert-danger mt-2 mb-0', style.deviceListItemAlert)}>
            <Text id="integration.mqtt.device.saveError" />
          </div>
        )}
      </div>
    );
  }
}

export default DeviceListItem;
