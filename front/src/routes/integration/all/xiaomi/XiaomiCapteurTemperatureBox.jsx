import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import { RequestStatus } from '../../../../utils/consts';
import Feature from './Feature';
class XiaomiCapteurTemperatureBox extends Component {
  componentWillMount() {}

  updateCapteurRoom = e => {
    this.props.updateCapteurField(this.props.capteurIndex, 'room_id', e.target.value);
  };

  updateCapteurName = e => {
    this.props.updateCapteurField(this.props.capteurIndex, 'name', e.target.value);
  };

  updateFeatureName = e => {
    this.props.updateCapteurField(this.props.capteurIndex, 'name', e.target);
  };

  saveCapteur = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.saveCapteur(this.props.capteurIndex, this.props.capteur);
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
                {this.props.capteur.features.map((feature, index) => (
                  <Feature
                    feature={feature}
                    featureIndex={index}
                    updateFeatureName={this.props.updateFeatureName}
                  />
                ))}
                <div class="form-group">
                  <label>
                    <Text id="integration.xiaomi.roomLabel" />
                  </label>
                  <select class="form-control" onChange={this.updateCapteurRoom}>
                    <option value="">-------</option>
                    {props.houses &&
                      props.houses.map(house => (
                        <optgroup label={house.name}>
                          {house.rooms.map(room => (
                            <option selected={room.id === props.capteur.room_id} value={room.id}>
                              {room.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                  </select>
                </div>
                <div class="form-group">
                  <button onClick={this.saveCapteur} class="btn btn-success mr-2">
                    <Text id="integration.xiaomi.saveButton" />
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

export default XiaomiCapteurTemperatureBox;
