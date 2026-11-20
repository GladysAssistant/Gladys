import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';
import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../../server/utils/constants';
import logoZigbee2mqtt from '../../../../../assets/integrations/logos/logo_zigbee2mqtt.png';
import style from './style.css';
import { MobileNotice, MobilePill, BigButton, kitStyle } from '../../../../../components/mobile';
import { MobileDeviceItem } from '../../../../../components/integration/mobile';

const GITHUB_BASE_URL = 'https://github.com/GladysAssistant/Gladys/issues/new';

const createGithubUrl = device => {
  const title = encodeURIComponent(`Zigbee2mqtt: Add device ${device.model}`);
  const body = encodeURIComponent(`\`\`\`\n${JSON.stringify(device, null, 2)}\n\`\`\``);
  return `${GITHUB_BASE_URL}?title=${title}&body=${body}`;
};

class DiscoveredBox extends Component {
  updateName = e => {
    this.props.updateDeviceField(this.props.deviceIndex, 'name', e.target.value);
  };

  updateRoom = e => {
    this.props.updateDeviceField(this.props.deviceIndex, 'room_id', e.target.value);
  };

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

  // On a phone: a row and its sheet, fed by the handlers of the card
  // (docs/specs/mobile-pages/integration-devices.md)
  renderMobile({ device, houses, z2mUrl, supportedDevice, enableUpdateButton, alreadyExistsButton, saveError }) {
    const ieeeAddress = device.ieee_address;
    let status = null;
    let primaryAction;
    if (!supportedDevice) {
      status = (
        <MobilePill>
          <Text id="mobileDeviceList.notSupported" />
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
        toast: <Text id="mobileDeviceList.added" />
      };
    }
    return (
      <MobileDeviceItem
        device={device}
        houses={houses}
        subtitle={device.model || device.external_id}
        status={status}
        notices={
          !supportedDevice && (
            <MobileNotice tone="warning" icon="alert-triangle">
              <Text id="integration.zigbee2mqtt.discover.deviceNotHandled" />
            </MobileNotice>
          )
        }
        onNameChange={this.updateName}
        onRoomChange={supportedDevice ? this.updateRoom : undefined}
        namePlaceholderId="integration.zigbee2mqtt.namePlaceholder"
        fieldsDisabled={!supportedDevice}
        guard={false}
        showFeatures={supportedDevice}
        details={
          supportedDevice
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
        {supportedDevice && z2mUrl && ieeeAddress && (
          <a
            href={`${z2mUrl}/#/device/0/${ieeeAddress}/info`}
            target="_blank"
            rel="noopener noreferrer"
            class={kitStyle.linkButton}
            data-cy="z2m-device-open-in-z2m"
          >
            <img src={logoZigbee2mqtt} alt="" class={style.z2mDeviceLinkLogo} />
            <Text id="integration.zigbee2mqtt.openInZ2mButton" />
          </a>
        )}
        {!supportedDevice && (
          <BigButton
            icon="github"
            href={createGithubUrl(device)}
            target="_blank"
            rel="noopener noreferrer"
            data-cy="z2m-discovered-suggest"
          >
            <Text id="integration.zigbee2mqtt.discover.createGithubIssue" />
          </BigButton>
        )}
      </MobileDeviceItem>
    );
  }

  render({ device = {}, deviceIndex, houses = [], z2mUrl, isMobile }, { loading, saveError }) {
    const { features = [], ieee_address = null } = device;
    const enableSaveButton = !device.created_at;
    const enableUpdateButton = device.updatable;
    const supportedDevice = features.findIndex(f => f.category !== DEVICE_FEATURE_CATEGORIES.BATTERY) >= 0;
    const alreadyExistsButton = supportedDevice && !enableSaveButton && !enableUpdateButton;

    if (isMobile) {
      return this.renderMobile({
        device,
        houses,
        z2mUrl,
        supportedDevice,
        enableUpdateButton,
        alreadyExistsButton,
        saveError
      });
    }

    return (
      <div class="col-md-6">
        <div class="card">
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
                      disabled={!supportedDevice}
                    />
                  </Localizer>
                </div>
                {!supportedDevice && (
                  <div>
                    <div class="alert alert-warning">
                      <Text id="integration.zigbee2mqtt.discover.deviceNotHandled" />
                    </div>
                    <a class="btn btn-primary" href={createGithubUrl(device)} target="_blank" rel="noopener noreferrer">
                      <Text id="integration.zigbee2mqtt.discover.createGithubIssue" />
                    </a>
                  </div>
                )}

                {supportedDevice && (
                  <div>
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
                            href={`${z2mUrl}/#/device/0/${ieee_address}/info`}
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
                        <button onClick={this.saveDevice} class="btn btn-success mr-2">
                          <Text id="integration.zigbee2mqtt.saveButton" />
                        </button>
                      )}
                    </div>
                  </div>
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
