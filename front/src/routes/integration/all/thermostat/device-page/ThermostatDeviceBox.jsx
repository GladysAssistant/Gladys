import { Text, MarkupText } from 'preact-i18n';
import { Component } from 'preact';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import get from 'get-value';
import style from './style.css';

class ThermostatDeviceBox extends Component {
  saveDevice = async () => {
    this.setState({ saving: true, saveError: false });
    try {
      await this.props.saveDevice(this.props.device, this.props.deviceIndex);
    } catch (e) {
      this.setState({ saveError: true });
    }
    this.setState({ saving: false });
  };

  deleteDevice = async () => {
    this.setState({ deleting: true, tooMuchStatesError: false, statesNumber: undefined, deleteError: false });
    try {
      await this.props.deleteDevice(this.props.device, this.props.deviceIndex);
    } catch (e) {
      const status = get(e, 'response.status');
      const dataMessage = get(e, 'response.data.message');
      if (status === 400 && dataMessage && dataMessage.includes('Too much states')) {
        const statesNumber = new Intl.NumberFormat().format(dataMessage.split(' ')[0]);
        this.setState({ tooMuchStatesError: true, statesNumber });
      } else {
        this.setState({ deleteError: true });
      }
    }
    this.setState({ deleting: false });
  };

  updateName = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'name', e.target.value);
  };

  updateRoom = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'room_id', e.target.value);
  };

  updateActiveSchedule = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'active_schedule', e.target.value);
  };

  render(props, { saving, deleting, saveError, deleteError, tooMuchStatesError, statesNumber }) {
    const { device } = props;
    const loading = saving || deleting;

    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">{device.name || <Text id="integration.thermostat.device.noNameLabel" />}</div>
          <div class={cx('dimmer', { active: loading })}>
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body">
                {tooMuchStatesError && (
                  <div class="alert alert-warning">
                    <MarkupText id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />
                  </div>
                )}
                {deleteError && (
                  <div class="alert alert-danger">
                    <Text id="integration.thermostat.device.deleteError" />
                  </div>
                )}
                {saveError && (
                  <div class="alert alert-danger">
                    <Text id="integration.thermostat.device.saveError" />
                  </div>
                )}

                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.thermostat.device.nameLabel" />
                  </label>
                  <input type="text" class="form-control" value={device.name} onInput={this.updateName} />
                </div>

                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.thermostat.device.roomLabel" />
                  </label>
                  <select onChange={this.updateRoom} class="form-control">
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {props.houses &&
                      props.houses.map(house => (
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

                <div class={style.buttonGroup}>
                  <button
                    onClick={this.saveDevice}
                    class={cx('btn', 'btn-success', 'flex-fill', { 'btn-loading': saving })}
                  >
                    <Text id="integration.thermostat.device.saveButton" />
                  </button>
                  <button
                    onClick={this.deleteDevice}
                    class={cx('btn', 'btn-danger', 'flex-fill', { 'btn-loading': deleting })}
                  >
                    <Text id="integration.thermostat.device.deleteButton" />
                  </button>
                  <Link
                    href={`/dashboard/integration/device/thermostat/edit/${device.selector}`}
                    class="btn btn-primary flex-fill"
                  >
                    <Text id="integration.thermostat.device.editButton" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ThermostatDeviceBox;
