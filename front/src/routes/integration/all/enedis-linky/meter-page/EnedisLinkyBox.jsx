import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import get from 'get-value';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';

class EnedisLinkyBox extends Component {
  saveLinky = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.saveLinky(this.props.linkyIndex);
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
  deleteLinky = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.deleteLinky(this.props.linkyIndex);
    } catch (e) {
      this.setState({
        error: RequestStatus.Error
      });
    }
    this.setState({
      loading: false
    });
  };
  testConnection = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.testConnection(this.props.linkyIndex);
      this.setState({
        testConnectionError: null,
        testConnectionErrorMessage: null
      });
    } catch (e) {
      this.setState({
        testConnectionError: RequestStatus.Error,
        testConnectionErrorMessage: get(e, 'response.data.error')
      });
    }
    this.setState({
      loading: false
    });
  };
  updateLinkyName = e => {
    this.props.updateLinkyField(this.props.linkyIndex, 'name', e.target.value);
  };
  updateLinkyUsagePoint = e => {
    this.props.updateLinkyUsagePoint(this.props.linkyIndex, e.target.value);
  };
  updateLinkyRoom = e => {
    const newRoom = e.target.value === '' ? null : e.target.value;
    this.props.updateLinkyField(this.props.linkyIndex, 'room_id', newRoom);
  };

  render(props, { loading, saveError, testConnectionError, testConnectionErrorMessage }) {
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
              {props.linky.linkyJson &&
                // <img class="card-img-top" src={`data:${props.camera.cameraImage}`} alt={props.camera.name} />
                console.log(props.linky.linkyJson)}
              <div class="card-body">
                {saveError && (
                  <div class="alert alert-danger">
                    <Text id="integration.enedisLinky.saveError" />
                  </div>
                )}
                {testConnectionError && (
                  <div class="alert alert-danger">
                    <Text id="integration.enedisLinky.testConnectionError" />
                  </div>
                )}
                {testConnectionErrorMessage && <div class="alert alert-danger">{testConnectionErrorMessage}</div>}
                <div class="form-group">
                  <label>
                    <Text id="integration.enedisLinky.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      value={props.linky.name}
                      onInput={this.updateLinkyName}
                      class="form-control"
                      placeholder={<Text id="integration.enedisLinky.namePlaceholder" />}
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label>
                    <Text id="integration.enedisLinky.roomLabel" />
                  </label>
                  <select onChange={this.updateLinkyRoom} class="form-control">
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {props.housesWithRooms &&
                      props.housesWithRooms.map(house => (
                        <optgroup label={house.name}>
                          {house.rooms.map(room => (
                            <option selected={room.id === props.linky.room_id} value={room.id}>
                              {room.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                  </select>
                </div>
                <div class="form-group">
                  <label>
                    <Text id="integration.enedisLinky.usagePointLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      value={get(props, 'linky.linkyUsagePoint.value')}
                      onInput={this.updateLinkyUsagePoint}
                      class="form-control"
                      placeholder={<Text id="integration.enedisLinky.usagePointPlaceholder" />}
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <button onClick={this.testConnection} class="btn btn-info mr-2">
                    <Text id="integration.enedisLinky.testConnectionButton" />
                  </button>
                  <button onClick={this.saveLinky} class="btn btn-success mr-2">
                    <Text id="integration.enedisLinky.saveButton" />
                  </button>
                  <button onClick={this.deleteLinky} class="btn btn-danger">
                    <Text id="integration.enedisLinky.deleteButton" />
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
export default EnedisLinkyBox;
