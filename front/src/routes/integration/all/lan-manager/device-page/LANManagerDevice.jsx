import { Text, Localizer, MarkupText } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import get from 'get-value';

import { RequestStatus } from '../../../../../utils/consts';
import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';
import { PARAMS } from '../../../../../../../server/services/lan-manager/lib/lan-manager.constants';
import { MobileDeviceItem } from '../../../../../components/integration/mobile';
import DeleteDeviceButton from '../../../../../components/device/DeleteDeviceButton';

class LANManagerDevice extends Component {
  // resolves to false when the device could not be saved (the phone sheet then stays open)
  saveDevice = async () => {
    this.setState({ loading: true });
    let saved = true;
    try {
      await this.props.saveDevice(this.props.deviceIndex);
    } catch (e) {
      this.setState({ error: RequestStatus.Error });
      saved = false;
    }
    this.setState({ loading: false });
    return saved;
  };
  // resolves to false when the device could not be deleted
  deleteDevice = async () => {
    this.setState({ loading: true, tooMuchStatesError: false, statesNumber: undefined, deleteError: false });
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
        // said on the card: after the confirmation, a failure must not look like nothing happened
        this.setState({ deleteError: true });
      }
    }
    this.setState({ loading: false });
    return deleted;
  };
  updateName = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'name', e.target.value);
  };
  updateRoom = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'room_id', e.target.value);
  };

  render({ device, houses, isMobile }, { loading, tooMuchStatesError, statesNumber, deleteError }) {
    const manufacturer = device.params.find(param => param.name === PARAMS.MANUFACTURER);
    const macAddress = device.params.find(param => param.name === PARAMS.MAC);
    const orginalName = device.params.find(param => param.name === PARAMS.NAME);

    // On a phone: a row and its sheet, fed by the handlers of the card
    // (docs/specs/mobile-pages/integration-devices.md)
    if (isMobile) {
      return (
        <MobileDeviceItem
          device={device}
          houses={houses}
          onNameChange={this.updateName}
          onRoomChange={this.updateRoom}
          details={[
            {
              label: <Text id="integration.lanManager.device.manufacturerLabel" />,
              value: get(manufacturer, 'value')
            },
            {
              label: <Text id="integration.lanManager.device.macAddressLabel" />,
              value: get(macAddress, 'value'),
              mono: true
            },
            {
              label: <Text id="integration.lanManager.device.originalNameLabel" />,
              value: get(orginalName, 'value')
            }
          ]}
          onSave={this.saveDevice}
          onDelete={this.deleteDevice}
          deleteError={
            tooMuchStatesError ? (
              <MarkupText id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />
            ) : null
          }
          deleteScheduled={Boolean(tooMuchStatesError)}
          dataCy="lan-manager-device-row"
        />
      );
    }

    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">{device.name}</div>
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body">
                {deleteError && (
                  <div class="alert alert-danger" data-cy="device-delete-error">
                    <Text id="mobileDeviceList.deleteError" />
                  </div>
                )}
                {tooMuchStatesError && (
                  <div class="alert alert-warning">
                    <MarkupText id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label">
                    <Text id="editDeviceForm.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="editDeviceForm.namePlaceholder" />}
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <Text id="editDeviceForm.roomLabel" />
                  </label>
                  <select onChange={this.updateRoom} class="form-control">
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {houses &&
                      houses.map(house => (
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
                  <label class="form-label">
                    <Text id="integration.lanManager.device.manufacturerLabel" />
                  </label>
                  <Localizer>
                    <input type="text" value={get(manufacturer, 'value')} class="form-control" disabled />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.lanManager.device.macAddressLabel" />
                  </label>
                  <Localizer>
                    <input type="text" value={get(macAddress, 'value')} class="form-control" disabled />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.lanManager.device.originalNameLabel" />
                  </label>
                  <Localizer>
                    <input type="text" value={get(orginalName, 'value')} class="form-control" disabled />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <Text id="editDeviceForm.featuresLabel" />
                  </label>
                  <DeviceFeatures features={device.features} />
                </div>
                <div class="form-group">
                  <button onClick={this.saveDevice} class="btn btn-success mr-2">
                    <Text id="editDeviceForm.saveButton" />
                  </button>
                  <DeleteDeviceButton device={device} onDelete={this.deleteDevice} class="btn btn-danger">
                    <Text id="editDeviceForm.deleteButton" />
                  </DeleteDeviceButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default LANManagerDevice;
