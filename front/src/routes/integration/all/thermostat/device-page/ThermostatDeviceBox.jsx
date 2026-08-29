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

  askDelete = () => this.setState({ confirmDelete: true });

  cancelDelete = () => this.setState({ confirmDelete: false });

  deleteDevice = async () => {
    this.setState({
      deleting: true,
      confirmDelete: false,
      tooMuchStatesError: false,
      statesNumber: undefined,
      deleteError: false
    });
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

  render(props, { saving, deleting, saveError, deleteError, tooMuchStatesError, statesNumber, confirmDelete }) {
    const { device } = props;
    const loading = saving || deleting;
    // Both are read-only here: the card summarises what the thermostat is set to,
    // while changing either stays in the edit page.
    const activeSchedule = (props.thermostatSchedules || []).find(s => s.selector === device.active_schedule);
    const scheduleName = activeSchedule ? activeSchedule.name : null;
    // A virtual thermostat owns its setpoint feature; an external one has none,
    // and its setpoint lives on the real device it drives — read alongside the
    // list and handed over as `external_setpoint_feature`. Looking for a
    // target-temperature feature on the thermostat device itself would find
    // nothing there, and the card would read "no setpoint" on a thermostat that
    // has one.
    const setpointFeature =
      device.external_setpoint_feature ||
      (device.features || []).find(f => f.category === 'thermostat' && f.type === 'target-temperature');
    const setpoint =
      setpointFeature && setpointFeature.last_value !== null && setpointFeature.last_value !== undefined
        ? setpointFeature.last_value
        : null;
    const unitParam = (device.params || []).find(p => p.name === 'THERMOSTAT_TEMP_UNIT');
    // The real device declares the unit it works in, and it is the one the value
    // read above is expressed in: a celsius thermostat pointing at a fahrenheit
    // device would otherwise display its 70 as 70 °C.
    const featureUnit = setpointFeature && setpointFeature.unit;
    const tempUnitValue = featureUnit === 'fahrenheit' ? 'F' : (unitParam && unitParam.value) || 'C';

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

                <div class={style.summaryRow}>
                  <div class={style.summaryItem}>
                    <span class={style.summaryLabel}>
                      <Text id="integration.thermostat.device.activeScheduleLabel" />
                    </span>
                    <span class={style.summaryValue}>
                      {scheduleName || <Text id="integration.thermostat.device.noSchedule" />}
                    </span>
                  </div>
                  <div class={style.summaryItem}>
                    <span class={style.summaryLabel}>
                      <Text id="integration.thermostat.device.setpointLabel" />
                    </span>
                    <span class={style.summaryValue}>
                      {setpoint === null ? (
                        <Text id="integration.thermostat.device.noSetpoint" />
                      ) : (
                        `${setpoint} °${tempUnitValue}`
                      )}
                    </span>
                  </div>
                </div>

                {confirmDelete ? (
                  // The confirmation takes over the whole row: keeping Save and
                  // Edit alongside it would put four buttons in a col-md-6 card,
                  // where flex-fill shrinks them until the labels are cut off.
                  <div class={style.confirmDeleteRow}>
                    <span class={style.confirmDeleteText}>
                      <Text id="integration.thermostat.device.confirmDelete" />
                    </span>
                    <div class={style.buttonGroup}>
                      <button
                        onClick={this.deleteDevice}
                        class={cx('btn', 'btn-danger', 'flex-fill', { 'btn-loading': deleting })}
                      >
                        <Text id="integration.thermostat.device.confirmYes" />
                      </button>
                      <button onClick={this.cancelDelete} class="btn btn-secondary flex-fill">
                        <Text id="integration.thermostat.device.confirmNo" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div class={style.buttonGroup}>
                    <button
                      onClick={this.saveDevice}
                      class={cx('btn', 'btn-success', 'flex-fill', { 'btn-loading': saving })}
                    >
                      <Text id="integration.thermostat.device.saveButton" />
                    </button>
                    <button onClick={this.askDelete} class="btn btn-danger flex-fill">
                      <Text id="integration.thermostat.device.deleteButton" />
                    </button>
                    <Link
                      href={`/dashboard/integration/device/thermostat/edit/${device.selector}`}
                      class="btn btn-primary flex-fill"
                    >
                      <Text id="integration.thermostat.device.editButton" />
                    </Link>
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

export default ThermostatDeviceBox;
