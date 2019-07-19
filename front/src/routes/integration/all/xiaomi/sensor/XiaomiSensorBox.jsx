import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import { RequestStatus, DeviceFeatureCategoriesIcon } from '../../../../../utils/consts';

class XiaomiSensorBox extends Component {
  componentWillMount() {
    this.getTypeOfDevice();
  }

  getTypeOfDevice = () => {
    if (this.props.sensor.features.length > 1) {
      if (
        this.props.sensor.features[0].category === 'battery' &&
        this.props.sensor.features[1].category === 'temperature-sensor'
      ) {
        return <Text id="integration.xiaomi.temperatureSensor" />;
      } else if (
        this.props.sensor.features[0].category === 'battery' &&
        this.props.sensor.features[1].category === 'door-opening-sensor'
      ) {
        return <Text id="integration.xiaomi.doorOpeningSensor" />;
      } else if (
        this.props.sensor.features[0].category === 'battery' &&
        this.props.sensor.features[1].category === 'motion-sensor'
      ) {
        return <Text id="integration.xiaomi.motionSensor" />;
      } else if (
        this.props.sensor.features[0].category === 'battery' &&
        this.props.sensor.features[1].category === 'magnet-sensor'
      ) {
        return <Text id="integration.xiaomi.magnetSensor" />;
      } else if (
        this.props.sensor.features[0].category === 'battery' &&
        this.props.sensor.features[1].category === 'plug'
      ) {
        return <Text id="integration.xiaomi.plugSensor" />;
      } else {
        return <Text id="integration.xiaomi.otherSensor" />;
      }
    }
  };

  updateSensorRoom = e => {
    this.props.updateSensorField(this.props.sensorIndex, 'room_id', e.target.value);
  };

  updateSensorName = e => {
    this.props.updateSensorField(this.props.sensorIndex, 'name', e.target.value);
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
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h4>
              <i class="fe fe-cpu" /> {this.getTypeOfDevice()}
            </h4>
            {this.props.sensor.features[0].last_value && (
              <div class="page-options d-flex">
                <div class="tag tag-green">
                  {this.props.sensor.features[0].last_value}%
                  <span class="tag-addon">
                    <i class="fe fe-battery" />
                  </span>
                </div>
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
                <div class="form-group">
                  <label>
                    <Text id="integration.xiaomi.nameSensor" />
                  </label>
                  <input
                    type="text"
                    value={props.sensor.name}
                    onInput={this.updateSensorName}
                    class="form-control"
                    placeholder={<Text id="integration.xiaomi.nameSensor" />}
                  />
                </div>
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
                  <label>
                    <Text id="integration.zwave.device.featuresLabel" />
                  </label>
                  <div class="tags">
                    {props.sensor &&
                      props.sensor.features &&
                      props.sensor.features.map(feature => (
                        <span class="tag">
                          <Text id={`deviceFeatureCategory.${feature.category}`} />
                          <div class="tag-addon">
                            <i class={`fe fe-${DeviceFeatureCategoriesIcon[feature.category]}`} />
                          </div>
                        </span>
                      ))}
                    {(!props.sensor.features || props.sensor.features.length === 0) && (
                      <Text id="integration.xiaomi.noFeatures" />
                    )}
                  </div>
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
