import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';
import Feature from './Feature';

class XiaomiSensorBox extends Component {
  componentWillMount() {}

  updateSensorRoom = e => {
    this.props.updateSensorField(this.props.sensorIndex, 'room_id', e.target.value);
  };

  updateSensorName = e => {
    this.props.updateNameField(this.props.sensorIndex, 'name', e.target.value);
  };

  updateFeatureName = e => {
    this.props.updateSensorField(this.props.sensorIndex, 'name', e.target);
  };

  saveSensor = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.saveSensor(this.props.sensorIndex, this.props.sensor);
      this.setState({
        saveError: null
      });
    } catch (e) {
      this.setState({
        saveError: RequestStatus.Error
      });
    }
    this.setState({
      loading: false
    });
  };

  deleteSensor = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.deleteSensor(this.props.sensorIndex);
      this.setState({
        deleteError: null
      });
    } catch (e) {
      this.setState({
        deleteError: RequestStatus.Error
      });
    }
    this.setState({
      loading: false
    });
  };

  render(props, { loading, saveError, testConnectionError }) {
    return (
      <div class="col-md-4">
        <div class="card">
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body">
                {this.props.sensor.features.map((feature, indexFeature) => (
                  <Feature
                    feature={feature}
                    featureIndex={indexFeature}
                    updateNameFeature={this.props.updateNameFeature}
                    deviceIndex={this.props.sensorIndex}
                  />
                ))}
                <div class="form-group">
                  <label>
                    <Text id="integration.xiaomi.roomLabel" />
                  </label>
                  <select class="form-control" onChange={this.updateSensorRoom}>
                    <option value="">-------</option>
                    {props.houses &&
                      props.houses.map(house => (
                        <optgroup label={house.name}>
                          {house.rooms.map(room => (
                            <option selected={room.id === props.sensor.room_id} value={room.id}>
                              {room.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                  </select>
                </div>
                <div class="form-group">
                  <button onClick={this.saveSensor} class="btn btn-success mr-2">
                    <Text id="integration.xiaomi.saveButton" />
                  </button>
                  <button onClick={this.deleteSensor} class="btn btn-danger mr-2">
                    <Text id="integration.xiaomi.deleteButton" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default XiaomiSensorBox;
