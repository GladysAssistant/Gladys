import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import { RequestStatus } from '../../../../../utils/consts';

class KodiDeviceForm extends Component {
  updateName = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'name', e.target.value);
    this.props.updateDeviceProperty(this.props.deviceIndex, 'external_id', 'kodi:' + e.target.value);
  };
  updateRoom = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'room_id', e.target.value);
  };
  updateParam = e => {
    this.props.updateParamProperty(
      this.props.deviceIndex,
      e.target.attributes.paramIndex.value,
      e.target.name,
      e.target.value
    );
  };
  updateDefault = e => {
    this.props.updateParamProperty(this.props.deviceIndex, 0, e.target.id, e.target.checked);
  };
  saveDevice = async () => {
    this.setState({ loading: true });
    try {
      await this.props.saveDevice(this.props.device, this.props.deviceIndex);
    } catch (e) {
      this.setState({ error: RequestStatus.Error });
    }
    this.setState({ loading: false });
  };

  deleteDevice = async () => {
    this.setState({ loading: true });
    try {
      await this.props.deleteDevice(this.props.device, this.props.deviceIndex);
    } catch (e) {
      this.setState({ error: RequestStatus.Error });
    }
    this.setState({ loading: false });
  };

  render({ ...props }) {
    return (
      <div>
        <div class="form-group">
          <label class="form-label" for="deviceName">
            <Text id="integration.mqtt.device.nameLabel" />
          </label>
          <Localizer>
            <input
              id="deviceName"
              type="text"
              value={props.device.name}
              onInput={this.updateName}
              class="form-control"
              placeholder={<Text id="integration.mqtt.device.nameLabel" />}
            />
          </Localizer>
        </div>

        <div class="form-group">
          <label class="form-label" for="room">
            <Text id="integration.mqtt.device.roomLabel" />
          </label>
          <select onChange={this.updateRoom} class="form-control" id="room">
            <option value="">
              <Text id="global.emptySelectOption" />
            </option>
            {props.houses &&
              props.houses.map(house => (
                <optgroup label={house.name}>
                  {house.rooms.map(room => (
                    <option selected={room.id === props.device.room_id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </optgroup>
              ))}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="default">
            <Text id="integration.kodi.device.default" />
          </label>
          <div class="card-options">
            <label class="custom-switch m-0">
              <input
                id="default"
                type="checkbox"
                value="1"
                checked={props.device.params[0].value === 'true'}
                onClick={this.updateDefault}
                class="custom-switch-input"
              />
              <span class="custom-switch-indicator" />
            </label>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">
            <Text id="integration.kodi.device.paramsLabel" />
          </label>
          <div class="tags">
            {props.device &&
              props.device.params &&
              props.device.params.map(function(param, index) {
                if (param.name !== 'default') {
                  return (
                    <span class="tag">
                      <Localizer>
                        <input
                          id={param.id}
                          type="text"
                          name={param.name}
                          paramIndex={index}
                          onChange={this.updateParam}
                          value={param.value}
                          class="form-control"
                          placeholder={<Text id={`integration.kodi.device.param.no.${param.name}`} />}
                        />
                      </Localizer>
                    </span>
                  );
                }
                return null;
              }, this)}
            {(!props.device.params || props.device.params.length === 0) && (
              <div class="col-md-12">
                <div class="alert alert-info">
                  <Text id="integration.kodi.device.noParams" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default KodiDeviceForm;
