import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import get from 'get-value';

import { RequestStatus } from '../../../../../utils/consts';
import { getZ2mDeviceUrl } from '../utils/getZ2mUrl';
import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';
import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../../server/utils/constants';
import logoZigbee2mqtt from '../../../../../assets/integrations/logos/logo_zigbee2mqtt.png';
import style from './style.css';
import { MobileNotice, MobilePill, ConfirmSheet, kitStyle } from '../../../../../components/mobile';
import { MobileDeviceItem } from '../../../../../components/integration/mobile';
import AskZigbee2mqtt from '../commons/AskZigbee2mqtt';
import SuggestDevice from '../commons/SuggestDevice';
import { ZIGBEE2MQTT_SUPPORT, getSupport, hasUsefulFeature } from '../utils/support';

const S = 'integration.zigbee2mqtt.support';

// The confirmation of a device added with the features Zigbee2mqtt generated (E.3)
export const getGenericConfirm = dictionary => ({
  title: get(dictionary, `${S}.confirmTitle`),
  text: <Text id={`${S}.confirmText`} />,
  confirmLabel: <Text id={`${S}.confirmAdd`} />
});

class DiscoveredBox extends Component {
  updateName = e => {
    this.props.updateDeviceField(this.props.deviceIndex, 'name', e.target.value);
  };

  updateRoom = e => {
    this.props.updateDeviceField(this.props.deviceIndex, 'room_id', e.target.value);
  };

  askGenericConfirm = () => this.setState({ confirmGeneric: true });

  cancelGenericConfirm = () => {
    if (!this.state.loading) {
      this.setState({ confirmGeneric: false });
    }
  };

  confirmGeneric = async () => {
    await this.saveDevice();
    if (!this.unmounted) {
      this.setState({ confirmGeneric: false });
    }
  };

  componentWillUnmount() {
    this.unmounted = true;
  }

  // resolves to false when the device could not be saved (the phone sheet then stays open)
  saveDevice = async () => {
    this.setState({
      loading: true
    });
    let saved = true;
    try {
      await this.props.saveDevice(this.props.deviceIndex);
      this.setState({
        saveError: null
      });
    } catch (e) {
      this.setState({
        saveError: RequestStatus.Error
      });
      saved = false;
    }
    this.setState({
      loading: false
    });
    return saved;
  };

  // What the card says of a device it cannot add as is (docs/specs/zigbee2mqtt-pairing.md, E.4)
  renderNotUsable({ device, support, isMobile, dictionary }) {
    const notice = id =>
      isMobile ? (
        <MobileNotice tone="warning" icon="alert-triangle">
          <Text id={id} />
        </MobileNotice>
      ) : (
        <div class="alert alert-warning">
          <Text id={id} />
        </div>
      );
    if (support === ZIGBEE2MQTT_SUPPORT.INTERVIEW_FAILED) {
      return (
        <div data-cy="z2m-discovered-interview-failed">{notice('integration.zigbee2mqtt.pairing.failedText')}</div>
      );
    }
    if (support === ZIGBEE2MQTT_SUPPORT.UNSUPPORTED) {
      return (
        <div data-cy="z2m-discovered-unsupported">
          {notice(`${S}.unsupportedText`)}
          <AskZigbee2mqtt device={device} isMobile={isMobile} />
        </div>
      );
    }
    // Known by Zigbee2mqtt, no feature Gladys can use, not even a signal
    return (
      <div data-cy="z2m-discovered-not-handled">
        {notice('integration.zigbee2mqtt.discover.deviceNotHandled')}
        <SuggestDevice device={device} dictionary={dictionary} isMobile={isMobile} />
      </div>
    );
  }

  // On a phone: a row and its sheet, fed by the handlers of the card
  // (docs/specs/mobile-pages/integration-devices.md)
  renderMobile({
    device,
    houses,
    z2mUrl,
    support,
    usable,
    onlySecondary,
    enableUpdateButton,
    alreadyExistsButton,
    saveError,
    dictionary
  }) {
    const ieeeAddress = device.ieee_address;
    const generic = support === ZIGBEE2MQTT_SUPPORT.GENERIC;
    let status = null;
    let primaryAction;
    if (!usable) {
      // Already in Gladys (added before, not recognized since): said so, nothing to add or update
      let label = 'mobileDeviceList.notSupported';
      if (device.created_at) {
        label = 'mobileDeviceList.inGladys';
      } else if (support === ZIGBEE2MQTT_SUPPORT.INTERVIEW_FAILED) {
        label = `${S}.interviewFailed`;
      }
      status = (
        <MobilePill tone={device.created_at ? 'success' : undefined}>
          <Text id={label} />
        </MobilePill>
      );
    } else if (enableUpdateButton) {
      status = (
        <MobilePill tone="accent">
          <Text id="mobileDeviceList.updateAvailable" />
        </MobilePill>
      );
      primaryAction = {
        label: <Text id="integration.zigbee2mqtt.updateButton" />,
        onClick: this.saveDevice,
        toast: <Text id="mobileDeviceList.updated" />
      };
    } else if (alreadyExistsButton) {
      status = (
        <MobilePill tone="success">
          <Text id="mobileDeviceList.inGladys" />
        </MobilePill>
      );
      primaryAction = { label: <Text id="integration.zigbee2mqtt.alreadyExistsButton" />, disabled: true };
    } else {
      primaryAction = {
        label: <Text id="integration.zigbee2mqtt.discover.addToGladys" />,
        onClick: this.saveDevice,
        toast: <Text id="mobileDeviceList.added" />,
        // Generic features: asked first (E.3)
        confirm: generic ? getGenericConfirm(dictionary) : undefined
      };
    }
    let notices = null;
    if (generic) {
      notices = (
        <MobileNotice tone="warning" icon="alert-triangle">
          <Text id={`${S}.genericText`} />
        </MobileNotice>
      );
    } else if (onlySecondary) {
      notices = (
        <MobileNotice icon="info" data-cy="z2m-discovered-only-secondary">
          <Text id={`${S}.onlySecondary`} />
        </MobileNotice>
      );
    } else if (!usable) {
      notices = this.renderNotUsable({ device, support, isMobile: true, dictionary });
    }
    return (
      <MobileDeviceItem
        device={device}
        houses={houses}
        subtitle={device.model || device.external_id}
        status={status}
        pills={
          generic && (
            <MobilePill tone="warning" data-cy="z2m-discovered-generic">
              <Text id={`${S}.genericBadge`} />
            </MobilePill>
          )
        }
        notices={notices}
        onNameChange={this.updateName}
        onRoomChange={usable ? this.updateRoom : undefined}
        namePlaceholderId="integration.zigbee2mqtt.namePlaceholder"
        fieldsDisabled={!usable}
        guard={false}
        showFeatures={usable}
        details={
          usable
            ? [
                { label: <Text id="integration.zigbee2mqtt.topicLabel" />, value: device.external_id, mono: true },
                { label: <Text id="integration.zigbee2mqtt.ieeeAddressLabel" />, value: ieeeAddress, mono: true }
              ]
            : []
        }
        saveError={saveError && <Text id="integration.zigbee2mqtt.saveError" />}
        primaryAction={primaryAction}
        dataCy="z2m-discovered-row"
      >
        {usable && z2mUrl && ieeeAddress && (
          <a
            href={getZ2mDeviceUrl(z2mUrl, ieeeAddress)}
            target="_blank"
            rel="noopener noreferrer"
            class={kitStyle.linkButton}
            data-cy="z2m-device-open-in-z2m"
          >
            <img src={logoZigbee2mqtt} alt="" class={style.z2mDeviceLinkLogo} />
            <Text id="integration.zigbee2mqtt.openInZ2mButton" />
          </a>
        )}
        {generic && <AskZigbee2mqtt device={device} isMobile />}
        {onlySecondary && <SuggestDevice device={device} dictionary={dictionary} isMobile />}
      </MobileDeviceItem>
    );
  }

  render(
    { device = {}, deviceIndex, houses = [], z2mUrl, isMobile, dictionary },
    { loading, saveError, confirmGeneric }
  ) {
    const { features = [], ieee_address = null } = device;
    const support = getSupport(device);
    const generic = support === ZIGBEE2MQTT_SUPPORT.GENERIC;
    const native = support === ZIGBEE2MQTT_SUPPORT.NATIVE;
    // What Gladys can add: a supported model with a feature besides its battery (a router and its signal included),
    // or the generic features of a model Zigbee2mqtt does not know (E.2)
    const usable = generic || (native && features.some(f => f.category !== DEVICE_FEATURE_CATEGORIES.BATTERY));
    // Supported, but only its battery or signal used by Gladys: added all the same, and suggested on the forum (E.4 b)
    const onlySecondary = native && usable && !hasUsefulFeature(features);
    const enableSaveButton = !device.created_at;
    const enableUpdateButton = device.updatable;
    const alreadyExistsButton = usable && !enableSaveButton && !enableUpdateButton;

    if (isMobile) {
      return this.renderMobile({
        device,
        houses,
        z2mUrl,
        support,
        usable,
        onlySecondary,
        enableUpdateButton,
        alreadyExistsButton,
        saveError,
        dictionary
      });
    }

    return (
      <div class="col-md-6">
        <div class="card" data-cy="z2m-discovered-card" data-support={support}>
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body">
                {saveError && (
                  <div class="alert alert-danger">
                    <Text id="integration.zigbee2mqtt.saveError" />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label" for={`name_${deviceIndex}`}>
                    <Text id="integration.zigbee2mqtt.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${deviceIndex}`}
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.zigbee2mqtt.namePlaceholder" />}
                      disabled={!usable}
                    />
                  </Localizer>
                </div>
                {!usable && this.renderNotUsable({ device, support, isMobile: false, dictionary })}
                {!usable && device.created_at && (
                  <button disabled="true" class="btn btn-primary" data-cy="z2m-discovered-in-gladys">
                    <Text id="integration.zigbee2mqtt.alreadyExistsButton" />
                  </button>
                )}

                {usable && (
                  <div>
                    {generic && (
                      <div class="alert alert-warning">
                        <span class="badge badge-warning mr-2" data-cy="z2m-discovered-generic">
                          <Text id={`${S}.genericBadge`} />
                        </span>
                        <Text id={`${S}.genericText`} />
                      </div>
                    )}
                    {onlySecondary && (
                      <div class="alert alert-info" data-cy="z2m-discovered-only-secondary">
                        <Text id={`${S}.onlySecondary`} />
                      </div>
                    )}
                    <div class="form-group">
                      <label class="form-label" for={`room_${deviceIndex}`}>
                        <Text id="integration.zigbee2mqtt.roomLabel" />
                      </label>
                      <select onChange={this.updateRoom} class="form-control" id={`room_${deviceIndex}`}>
                        <option value="">
                          <Text id="global.emptySelectOption" />
                        </option>
                        {houses.map(house => (
                          <optgroup label={house.name}>
                            {house.rooms.map(room => (
                              <option selected={room.id === device.room_id} value={room.id}>
                                {room.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div class="form-group">
                      <label class="form-label" for={`topic_${deviceIndex}`}>
                        <Text id="integration.zigbee2mqtt.topicLabel" />
                      </label>
                      <Localizer>
                        <input
                          id={`topic_${deviceIndex}`}
                          type="text"
                          value={device.external_id}
                          class="form-control"
                          disabled="true"
                        />
                      </Localizer>
                    </div>

                    {ieee_address && (
                      <div class="form-group">
                        <label class="form-label">
                          <Text id="integration.zigbee2mqtt.ieeeAddressLabel" />
                        </label>
                        <input type="text" class="form-control" value={ieee_address} disabled />
                        {z2mUrl && (
                          <a
                            href={getZ2mDeviceUrl(z2mUrl, ieee_address)}
                            target="_blank"
                            rel="noopener noreferrer"
                            class={`${style.z2mDeviceLink} mt-2 text-muted`}
                          >
                            <img src={logoZigbee2mqtt} alt="Zigbee2mqtt" class={style.z2mDeviceLinkLogo} />
                            <Text id="integration.zigbee2mqtt.openInZ2mButton" />
                          </a>
                        )}
                      </div>
                    )}

                    <div class="form-group">
                      <label class="form-label">
                        <Text id="integration.zigbee2mqtt.featuresLabel" />
                      </label>
                      <DeviceFeatures features={device.features} />
                    </div>

                    <div class="form-group">
                      {alreadyExistsButton && (
                        <button disabled="true" class="btn btn-primary mr-2">
                          <Text id="integration.zigbee2mqtt.alreadyExistsButton" />
                        </button>
                      )}
                      {enableUpdateButton && (
                        <button onClick={this.saveDevice} class="btn btn-success mr-2">
                          <Text id="integration.zigbee2mqtt.updateButton" />
                        </button>
                      )}
                      {enableSaveButton && (
                        <button
                          onClick={generic ? this.askGenericConfirm : this.saveDevice}
                          class="btn btn-success mr-2"
                          data-cy="z2m-discovered-save"
                        >
                          <Text id="integration.zigbee2mqtt.saveButton" />
                        </button>
                      )}
                    </div>
                    {generic && <AskZigbee2mqtt device={device} />}
                    {onlySecondary && <SuggestDevice device={device} dictionary={dictionary} />}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {generic && (
          <ConfirmSheet
            open={Boolean(confirmGeneric)}
            {...getGenericConfirm(dictionary)}
            loading={loading}
            onConfirm={this.confirmGeneric}
            onCancel={this.cancelGenericConfirm}
            dataCy="z2m-discovered-generic-confirm"
          />
        )}
      </div>
    );
  }
}

export default DiscoveredBox;
