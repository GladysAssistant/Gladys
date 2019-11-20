import { Text } from 'preact-i18n';
import { Component } from 'preact';
import reactCSS from 'reactcss'
import { Github } from 'react-color';
import { SketchPicker } from 'react-color'
import { Link } from 'preact-router/match';
import cx from 'classnames';
import get from 'get-value';
import { DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';
import { RequestStatus, DeviceFeatureCategoriesIcon } from '../../../../utils/consts';

class Device extends Component {

  state = {
    displayColorPicker: false,
  };

  refreshDeviceProperty = () => {
    if (!this.props.device.features) {
      return null;
    }

    const colorDeviceFeature = this.props.device.features.find(
      deviceFeature => deviceFeature.type === DEVICE_FEATURE_TYPES.LIGHT.COLOR
    );

    const color = get(colorDeviceFeature, 'last_value');

    this.setState({
      color
    });
  };

  saveDevice = async () => {
    this.setState({ loading: true });
    try {
      await this.props.saveDevice(this.props.device);
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

  updateName = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'name', e.target.value);
  };

  updateRoom = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'room_id', e.target.value);
  };

  handleButtonColor = () => {
    this.setState({ displayColorPicker: !this.state.displayColorPicker })
  };

  handleCloseColor = () => {
    this.setState({ displayColorPicker: false })
  };

  handleChangeColor = (color) => {
    this.setState({ color: color.hsl })
  };

  componentWillMount() {
    this.refreshDeviceProperty();
  }

  componentWillUpdate() {
    this.refreshDeviceProperty();
  }

  render(props, { color, loading, error }) {

    const styles = reactCSS({
      'default': {
        color: {
          width: '36px',
          height: '14px',
          borderRadius: '2px',
          background: `hsl(${ this.state.color.h }, ${ this.state.color.s }, ${ this.state.color.l }, 1)`,
        },
        swatch: {
          padding: '5px',
          background: '#fff',
          borderRadius: '1px',
          boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
          display: 'inline-block',
          cursor: 'pointer',
        },
        popover: {
          position: 'absolute',
          zIndex: '2',
        },
        cover: {
          position: 'fixed',
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px',
        },
      },
    });

    return (
      <div class="col-md-4">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">{props.device.name}</h3>
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
                    <Text id="integration.common.labels.name" />
                  </label>
                  <input
                    type="text"
                    value={props.device.name}
                    onInput={this.updateName}
                    class="form-control"
                    placeholder={props.device.model}
                  />
                </div>

                <div class="form-group">
                  <label>
                    <Text id="integration.common.labels.color" />
                  </label>
                  <div>
                    <div style={ styles.swatch } onClick={ this.handleClick }>
                      <div style={ styles.color } />
                    </div>
                    { this.state.displayColorPicker ? <div style={ styles.popover }>
                      <div style={ styles.cover } onClick={ this.handleClose }/>
                      <SketchPicker color={ this.state.color } onChange={ this.handleChange } />
                    </div> : null }
                  </div>
                </div>

                <div class="form-group">
                  <label>
                    <Text id="integration.common.labels.model" />
                  </label>
                  <input type="text" value={props.device.model} class="form-control" disabled />
                </div>                

                <div class="form-group">
                  <label>
                    <Text id="integration.magicDevices.device.macLabel" />
                  </label>
                  <input type="text" value={props.device.external_id.split(':')[1]} class="form-control" disabled />
                </div>

                <div class="form-group">
                  <label>
                    <Text id="integration.magicDevices.device.ipLabel" />
                  </label>
                  <input type="text" value="192.168.0.xxx" class="form-control" disabled />
                </div>

                <div class="form-group">
                  <label>
                    <Text id="integration.magicDevices.device.ipLabel" />
                  </label>
                  <input type="text" value="192.168.0.xxx" class="form-control" disabled />
                </div>

                <div class="form-group">
                  <label>
                    <Text id="integration.common.labels.room" />
                  </label>
                  <select onChange={this.updateRoom} class="form-control">
                    <option value="">-------</option>
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
                  <label>
                    <Text id="integration.common.labels.features" />
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
                    {(!props.device.features || props.device.features.length === 0) && (
                      <Text id="integration.magicDevices.device.noFeatures" />
                    )}
                  </div>
                </div>
                <div class="form-group">
                  <button onClick={this.saveDevice} class="btn btn-success mr-2">
                    <Text id="integration.common.buttons.save" />
                  </button>
                  <button onClick={this.deleteDevice} class="btn btn-danger">
                    <Text id="integration.common.buttons.delete" />
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

export default Device;
