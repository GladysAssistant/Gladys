import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';
import DeviceParams from '../components/DeviceParams';
import DeviceCreateErrorAlert, { DeviceCreateErrorContent } from '../components/DeviceCreateErrorAlert';
import { MobilePill } from '../../../../../components/mobile';
import { MobileDeviceItem } from '../../../../../components/integration/mobile';

// the technical params of the sheet: the transport ones are not shown as such
const INTERNAL_PARAMS = ['GLADYS_TRANSPORT', 'GLADYS_TRANSPORT_DEGRADED', 'GLADYS_TRANSPORT_MESSAGE'];
import { getDiscoveredDeviceCreateError } from '../../../../../utils/formatErrors';

class DiscoveredBox extends Component {
  // resolves to false when the device could not be created (the phone sheet then stays open)
  createDevice = async () => {
    this.setState({ loading: true, errorMessage: null, errorDetail: null, validationErrors: [], isKnownError: true });
    let created = true;
    try {
      // false: the device is gone from the list, nothing was posted
      created = (await this.props.createDevice(this.props.device.external_id)) !== false;
    } catch (e) {
      console.error(e);
      this.setState(getDiscoveredDeviceCreateError(e));
      created = false;
    }
    this.setState({ loading: false });
    return created;
  };

  render({ device, isMobile }, { loading, errorMessage, errorDetail, validationErrors, isKnownError }) {
    // On a phone: a row and its sheet, fed by the handler of the card
    // (docs/specs/mobile-pages/integration-devices.md)
    if (isMobile) {
      const update = Boolean(device.created && device.structure_changed);
      const featureCount = (device.features || []).length;
      let status = null;
      if (update) {
        status = (
          <MobilePill tone="accent">
            <Text id="mobileDeviceList.updateAvailable" />
          </MobilePill>
        );
      } else if (device.created) {
        status = (
          <MobilePill tone="success">
            <Text id="integration.externalIntegration.discover.alreadyCreatedBadge" />
          </MobilePill>
        );
      }
      return (
        <MobileDeviceItem
          device={device}
          subtitle={
            <Text id="editDeviceForm.mobile.featuresTitle" plural={featureCount} fields={{ count: featureCount }} />
          }
          status={status}
          details={(device.params || [])
            .filter(param => !INTERNAL_PARAMS.includes(param.name))
            .map(param => ({ label: param.name, value: param.value, mono: true }))}
          detailsFolded
          saveError={
            errorMessage && (
              <DeviceCreateErrorContent
                errorMessage={errorMessage}
                errorDetail={errorDetail}
                validationErrors={validationErrors}
                isKnownError={isKnownError}
              />
            )
          }
          primaryAction={
            update
              ? {
                  label: <Text id="integration.externalIntegration.discover.updateButton" />,
                  icon: 'refresh-cw',
                  onClick: this.createDevice,
                  toast: <Text id="mobileDeviceList.updated" />
                }
              : {
                  label: <Text id="integration.externalIntegration.discover.createButton" />,
                  onClick: this.createDevice,
                  disabled: Boolean(device.created),
                  toast: <Text id="mobileDeviceList.added" />
                }
          }
          dataCy="external-discovered-row"
        />
      );
    }
    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            {device.name}
            {device.created && (
              <div class="page-options d-flex">
                <span class="badge badge-success">
                  <Text id="integration.externalIntegration.discover.alreadyCreatedBadge" />
                </span>
              </div>
            )}
          </div>
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body">
                <DeviceCreateErrorAlert
                  errorMessage={errorMessage}
                  errorDetail={errorDetail}
                  validationErrors={validationErrors}
                  isKnownError={isKnownError}
                />
                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.externalIntegration.discover.featuresLabel" />
                  </label>
                  <DeviceFeatures features={device.features} />
                </div>
                <DeviceParams device={device} />
                {device.created && device.structure_changed ? (
                  <Localizer>
                    <button
                      onClick={this.createDevice}
                      class="btn btn-warning"
                      disabled={loading}
                      title={<Text id="integration.externalIntegration.discover.updateTitle" />}
                    >
                      <i class="fe fe-refresh-cw mr-1" />
                      <Text id="integration.externalIntegration.discover.updateButton" />
                    </button>
                  </Localizer>
                ) : (
                  <button onClick={this.createDevice} class="btn btn-success" disabled={device.created || loading}>
                    <Text id="integration.externalIntegration.discover.createButton" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default DiscoveredBox;
