import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import { GetFeatures, Models } from './models';
import { DeviceFeatureCategoriesIcon, RequestStatus } from '../../../../../utils/consts';
import get from 'get-value';

class SonoffBox extends Component {
  updateName = e => {
    this.props.updateDeviceField('sonoffDevices', this.props.deviceIndex, 'name', e.target.value);

    this.setState({
      loading: false
    });
  };

  updateRoom = e => {
    this.props.updateDeviceField('sonoffDevices', this.props.deviceIndex, 'room_id', e.target.value);

    this.setState({
      loading: false
    });
  };

  updateTopic = e => {
    let { value } = e.target;
    if (!value.startsWith('sonoff:')) {
      if (value.length < 7) {
        value = 'sonoff:';
      } else {
        value = `sonoff:${value}`;
      }
    }

    this.props.updateDeviceField('sonoffDevices', this.props.deviceIndex, 'external_id', value);

    this.setState({
      loading: false
    });
  };

  updateModel = e => {
    const selectedModel = e.target.value;

    this.props.updateDeviceField('sonoffDevices', this.props.deviceIndex, 'model', selectedModel);
    this.props.updateDeviceField('sonoffDevices', this.props.deviceIndex, 'features', GetFeatures(selectedModel));

    this.setState({
      loading: false
    });
  };

  saveDevice = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.saveDevice('sonoffDevices', this.props.deviceIndex);
      this.setState({
        saveError: null
      });
    } catch (e) {
      this.setState({
        saveError: e
      });
    }
    this.setState({
      loading: false
    });
  };

  deleteDevice = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.deleteDevice(this.props.deviceIndex);
    } catch (e) {
      this.setState({
        deleteError: RequestStatus.Error
      });
    }
    this.setState({
      loading: false
    });
  };

  render(props, { loading, saveError }) {
    let errorMessage = 'integration.sonoff.error.defaultError';
    if (saveError && saveError.response && saveError.response.status === 409) {
      errorMessage = 'integration.sonoff.error.conflictError';
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
                    <Text id={errorMessage} />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label" for={`name_${props.deviceIndex}`}>
                    <Text id="integration.sonoff.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${props.deviceIndex}`}
                      type="text"
                      value={props.device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.sonoff.namePlaceholder" />}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`room_${props.deviceIndex}`}>
                    <Text id="integration.sonoff.roomLabel" />
                  </label>
                  <select onChange={this.updateRoom} class="form-control" id={`room_${props.deviceIndex}`}>
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {props.housesWithRooms &&
                      props.housesWithRooms.map(house => (
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
                  <label class="form-label" for={`topic_${props.deviceIndex}`}>
                    <Text id="integration.sonoff.topicLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`topic_${props.deviceIndex}`}
                      type="text"
                      value={props.device.external_id}
                      onInput={this.updateTopic}
                      class="form-control"
                      placeholder={<Text id="integration.sonoff.topicPlaceholder" />}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`model_${props.deviceIndex}`}>
                    <Text id="integration.sonoff.modelLabel" />
                  </label>
                  <select onChange={this.updateModel} class="form-control" id={`model_${props.deviceIndex}`}>
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {Models &&
                      Object.keys(Models).map(model => (
                        <option selected={model === props.device.model} value={model}>
                          <Text id={`integration.sonoff.model.${model}`}>{model}</Text>
                        </option>
                      ))}
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.sonoff.device.featuresLabel" />
                  </label>
                  <div class="tags">
                    {props.device &&
                      props.device.features &&
                      props.device.features.map(feature => (
                        <span class="tag">
                          <Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`} />
                          <div class="tag-addon">
                            <i
                              class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`)}`}
                            />
                          </div>
                        </span>
                      ))}
                  </div>
                </div>

                <div class="form-group">
                  <button onClick={this.saveDevice} class="btn btn-success mr-2">
                    <Text id="integration.sonoff.saveButton" />
                  </button>
                  <button onClick={this.deleteDevice} class="btn btn-danger">
                    <Text id="integration.sonoff.deleteButton" />
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

export default SonoffBox;
