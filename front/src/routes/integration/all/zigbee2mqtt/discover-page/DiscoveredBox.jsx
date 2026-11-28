import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import { getZ2mDeviceUrl } from '../utils/getZ2mUrl';
import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';
import logoZigbee2mqtt from '../../../../../assets/integrations/logos/logo_zigbee2mqtt.png';
import style from './style.css';
import { MobileNotice, MobilePill, ConfirmSheet, kitStyle } from '../../../../../components/mobile';
import { MobileDeviceItem } from '../../../../../components/integration/mobile';
import AskZigbee2mqtt from '../commons/AskZigbee2mqtt';
import SuggestDevice from '../commons/SuggestDevice';
import { getGenericConfirm } from '../commons/genericConfirm';
import { ZIGBEE2MQTT_SUPPORT, getUsage } from '../utils/support';

const S = 'integration.zigbee2mqtt.support';

// What tells which physical device a card that cannot add it is about: its model and manufacturer as Zigbee2mqtt
// tells them, and its IEEE address when its name is not already it (docs/specs/zigbee2mqtt-pairing.md, E.5)
const getIdentity = device => {
  const info = device.zigbee2mqtt_info || {};
  return [
    { id: 'model-id', label: <Text id={`${S}.modelIdLabel`} />, value: info.model_id, mono: true },
    { id: 'manufacturer', label: <Text id={`${S}.manufacturerLabel`} />, value: info.manufacturer },
    device.ieee_address !== device.name && {
      id: 'ieee-address',
      label: <Text id="integration.zigbee2mqtt.ieeeAddressLabel" />,
      value: device.ieee_address,
      mono: true
    }
  ].filter(detail => detail && detail.value);
};

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

  // What the card says of a device it cannot add as is (docs/specs/zigbee2mqtt-pairing.md, E.4): its explanation, and
  // the report it can make (none for a failed identification)
  renderNotUsable({ device, support, isMobile, dictionary }) {
    const notice = (id, dataCy) =>
      isMobile ? (
        <MobileNotice tone="warning" icon="alert-triangle" data-cy={dataCy}>
          <Text id={id} />
        </MobileNotice>
      ) : (
        <div class="alert alert-warning" data-cy={dataCy}>
          <Text id={id} />
        </div>
      );
    if (support === ZIGBEE2MQTT_SUPPORT.INTERVIEW_FAILED) {
      return {
        notice: notice('integration.zigbee2mqtt.pairing.failedText', 'z2m-discovered-interview-failed'),
        report: null
      };
    }
    if (support === ZIGBEE2MQTT_SUPPORT.UNSUPPORTED) {
      return {
        notice: notice(`${S}.unsupportedText`, 'z2m-discovered-unsupported'),
        report: <AskZigbee2mqtt device={device} isMobile={isMobile} />
      };
    }
    // Known by Zigbee2mqtt, no feature Gladys can use, not even a signal
    return {
      notice: notice('integration.zigbee2mqtt.discover.deviceNotHandled', 'z2m-discovered-not-handled'),
      report: <SuggestDevice device={device} dictionary={dictionary} isMobile={isMobile} />
    };
  }

  // The pill of a device the row cannot add: in Gladys already, its identification failed, a model Zigbee2mqtt does
  // not know, or a model Gladys cannot use
  getNotUsableLabel(device, support) {
    if (device.created_at) {
      return 'mobileDeviceList.inGladys';
    }
    if (support === ZIGBEE2MQTT_SUPPORT.INTERVIEW_FAILED) {
      return `${S}.interviewFailed`;
    }
    if (support === ZIGBEE2MQTT_SUPPORT.UNSUPPORTED) {
      return `${S}.unknownModel`;
    }
    return 'mobileDeviceList.notSupported';
  }

  // A device the card cannot add: what it is as text, not a field to fill in with nothing to save (E.5)
  renderIdentity(device) {
    const identity = getIdentity(device);
    return (
      <div class="mb-3" data-cy="z2m-discovered-identity">
        <div class={cx('h4 mb-2', style.identityName)} data-cy="z2m-discovered-name">
          {device.name}
        </div>
        {identity.length > 0 && (
          <dl class={style.identity}>
            {identity.map(detail => (
              <div key={detail.id} class={style.identityRow}>
                <dt>{detail.label}</dt>
                <dd class={cx({ 'text-monospace': detail.mono })}>{detail.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    );
  }

  renderNotUsableDesktop(params) {
    const { notice, report } = this.renderNotUsable({ ...params, isMobile: false });
    return (
      <div>
        {notice}
        {report}
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
      status = (
        <MobilePill tone={device.created_at ? 'success' : undefined} data-cy="z2m-discovered-status">
          <Text id={this.getNotUsableLabel(device, support)} />
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
    // The reports come after the action of the sheet: they are not what one opens it for
    let notices = null;
    let report = null;
    if (generic) {
      notices = (
        <MobileNotice tone="warning" icon="alert-triangle">
          <Text id={`${S}.genericText`} />
        </MobileNotice>
      );
      report = <AskZigbee2mqtt device={device} isMobile />;
    } else if (onlySecondary) {
      notices = (
        <MobileNotice icon="info" data-cy="z2m-discovered-only-secondary">
          <Text id={`${S}.onlySecondary`} />
        </MobileNotice>
      );
      report = <SuggestDevice device={device} dictionary={dictionary} isMobile />;
    } else if (!usable) {
      ({ notice: notices, report } = this.renderNotUsable({ device, support, isMobile: true, dictionary }));
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
        // A device that cannot be added has no name to type: its sheet tells what it is (E.5)
        onNameChange={usable ? this.updateName : undefined}
        onRoomChange={usable ? this.updateRoom : undefined}
        namePlaceholderId="integration.zigbee2mqtt.namePlaceholder"
        guard={false}
        showFeatures={usable}
        details={
          usable
            ? [
                { label: <Text id="integration.zigbee2mqtt.topicLabel" />, value: device.external_id, mono: true },
                { label: <Text id="integration.zigbee2mqtt.ieeeAddressLabel" />, value: ieeeAddress, mono: true }
              ]
            : getIdentity(device)
        }
        saveError={saveError && <Text id="integration.zigbee2mqtt.saveError" />}
        primaryAction={primaryAction}
        footer={report}
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
      </MobileDeviceItem>
    );
  }

  render(
    { device = {}, deviceIndex, houses = [], z2mUrl, isMobile, dictionary },
    { loading, saveError, confirmGeneric }
  ) {
    const { ieee_address = null } = device;
    // What Gladys can add, and a supported device of which it only uses the battery or signal (E.2, E.4 b)
    const { support, usable, onlySecondary } = getUsage(device);
    const generic = support === ZIGBEE2MQTT_SUPPORT.GENERIC;
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
                {/* Over the name, on the card: inside the warning it took the colours of the warning */}
                {generic && (
                  <div class="mb-3">
                    <span class="badge badge-warning" data-cy="z2m-discovered-generic">
                      <Text id={`${S}.genericBadge`} />
                    </span>
                  </div>
                )}
                {usable && (
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
                      />
                    </Localizer>
                  </div>
                )}
                {!usable && this.renderIdentity(device)}
                {!usable && this.renderNotUsableDesktop({ device, support, dictionary })}
                {!usable && device.created_at && (
                  <button disabled="true" class="btn btn-primary" data-cy="z2m-discovered-in-gladys">
                    <Text id="integration.zigbee2mqtt.alreadyExistsButton" />
                  </button>
                )}

                {usable && (
                  <div>
                    {generic && (
                      <div class="alert alert-warning">
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
