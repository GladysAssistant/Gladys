import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';
import { MobileNotice, MobilePill } from '../../../../../components/mobile';
import { MobileDeviceItem } from '../../../../../components/integration/mobile';

class DiscoveredBox extends Component {
  updateName = e => {
    this.props.updateDeviceField(this.props.device.external_id, 'name', e.target.value);
  };

  updateRoom = e => {
    this.props.updateDeviceField(this.props.device.external_id, 'room_id', e.target.value);
  };

  // resolves to false when the device could not be saved (the phone sheet then stays open)
  saveDevice = async () => {
    this.setState({
      loading: true
    });
    let saved = true;
    try {
      await this.props.saveDevice(this.props.device.external_id);
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

  render({ device = {}, houses = [] }, { loading, saveError }) {
    const { features = [] } = device;
    // The list is re-ordered by live websocket updates, so DOM ids are derived from the stable
    // external_id instead of the position of the device in the list
    const domId = device.external_id;
    const supportedDevice = features.length > 0;
    const enableSaveButton = !device.created_at;
    const enableUpdateButton = device.updatable;
    const alreadyExistsButton = supportedDevice && !enableSaveButton && !enableUpdateButton;

    // On a phone: a row and its sheet, fed by the handlers of the card
    // (docs/specs/mobile-pages/integration-devices.md)
    if (this.props.isMobile) {
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
          label: <Text id="integration.mqtt.discover.updateButton" />,
          onClick: this.saveDevice,
          toast: <Text id="mobileDeviceList.updated" />
        };
      } else if (alreadyExistsButton) {
        status = (
          <MobilePill tone="success">
            <Text id="mobileDeviceList.inGladys" />
          </MobilePill>
        );
        primaryAction = { label: <Text id="integration.mqtt.discover.alreadyExistsButton" />, disabled: true };
      } else {
        primaryAction = {
          label: <Text id="integration.mqtt.discover.saveButton" />,
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
                <Text id="integration.mqtt.discover.deviceNotHandled" />
              </MobileNotice>
            )
          }
          onNameChange={this.updateName}
          onRoomChange={supportedDevice ? this.updateRoom : undefined}
          namePlaceholderId="integration.mqtt.discover.namePlaceholder"
          fieldsDisabled={!supportedDevice}
          guard={false}
          showFeatures={supportedDevice}
          details={
            supportedDevice
              ? [
                  { label: <Text id="integration.mqtt.discover.modelLabel" />, value: device.model },
                  {
                    label: <Text id="integration.mqtt.discover.externalIdLabel" />,
                    value: device.external_id,
                    mono: true
                  }
                ]
              : []
          }
          saveError={saveError && <Text id="integration.mqtt.discover.saveError" />}
          primaryAction={primaryAction}
          dataCy="mqtt-discovered-row"
        />
      );
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
                    <Text id="integration.mqtt.discover.saveError" />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label" for={`name_${domId}`}>
                    <Text id="integration.mqtt.discover.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${domId}`}
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.mqtt.discover.namePlaceholder" />}
                      disabled={!supportedDevice}
                    />
                  </Localizer>
                </div>
                {!supportedDevice && (
                  <div class="alert alert-warning">
                    <Text id="integration.mqtt.discover.deviceNotHandled" />
                  </div>
                )}

                {supportedDevice && (
                  <div>
                    <div class="form-group">
                      <label class="form-label" for={`room_${domId}`}>
                        <Text id="integration.mqtt.discover.roomLabel" />
                      </label>
                      <select onChange={this.updateRoom} class="form-control" id={`room_${domId}`}>
                        <option value="">
                          <Text id="global.emptySelectOption" />
                        </option>
                        {houses.map(house => (
                          <optgroup key={house.id} label={house.name}>
                            {house.rooms.map(room => (
                              <option key={room.id} selected={room.id === device.room_id} value={room.id}>
                                {room.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    {device.model && (
                      <div class="form-group">
                        <label class="form-label" for={`model_${domId}`}>
                          <Text id="integration.mqtt.discover.modelLabel" />
                        </label>
                        <input id={`model_${domId}`} type="text" value={device.model} class="form-control" disabled />
                      </div>
                    )}

                    <div class="form-group">
                      <label class="form-label" for={`external_id_${domId}`}>
                        <Text id="integration.mqtt.discover.externalIdLabel" />
                      </label>
                      <input
                        id={`external_id_${domId}`}
                        type="text"
                        value={device.external_id}
                        class="form-control"
                        disabled
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">
                        <Text id="integration.mqtt.discover.featuresLabel" />
                      </label>
                      <DeviceFeatures features={device.features} />
                    </div>

                    <div class="form-group">
                      {alreadyExistsButton && (
                        <button disabled="true" class="btn btn-primary mr-2">
                          <Text id="integration.mqtt.discover.alreadyExistsButton" />
                        </button>
                      )}
                      {enableUpdateButton && (
                        <button onClick={this.saveDevice} class="btn btn-success mr-2">
                          <Text id="integration.mqtt.discover.updateButton" />
                        </button>
                      )}
                      {enableSaveButton && (
                        <button onClick={this.saveDevice} class="btn btn-success mr-2">
                          <Text id="integration.mqtt.discover.saveButton" />
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
