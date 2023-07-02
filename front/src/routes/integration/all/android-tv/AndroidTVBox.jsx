import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import get from 'get-value';
import cx from 'classnames';
import { RequestStatus } from '../../../../utils/consts';

class AndroidTVBox extends Component {
  saveAndroidTV = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.saveAndroidTV(this.props.androidTVIndex);
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
  deleteAndroidTV = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.deleteAndroidTV(this.props.androidTVIndex);
    } catch (e) {
      this.setState({
        error: RequestStatus.Error
      });
    }
    this.setState({
      loading: false
    });
  };
  updateCodeTextInput = e => {
    this.setState({
      currentCodeTextInput: e.target.value
    });
  };
  sendCode = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.sendCode(this.props.androidTVIndex, this.props.androidTV.id, this.state.currentCodeTextInput);
    } catch (e) {
      this.setState({
        error: RequestStatus.Error
      });
    }
    this.setState({
      loading: false
    });
  };
  reconnect = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.reconnect(this.props.androidTV.selector);
    } catch (e) {
      this.setState({
        error: RequestStatus.Error
      });
    }
    this.setState({
      loading: false
    });
  };
  updateAndroidTVName = e => {
    this.props.updateAndroidTVField(this.props.androidTVIndex, 'name', e.target.value);
  };
  updateAndroidTVIP = e => {
    this.props.updateAndroidTVIP(this.props.androidTVIndex, e.target.value);
  };
  updateAndroidTVRoom = e => {
    const newRoom = e.target.value === '' ? null : e.target.value;
    this.props.updateAndroidTVField(this.props.androidTVIndex, 'room_id', newRoom);
  };

  render(props, { loading, saveError, currentCodeTextInput }) {
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
                {saveError && (
                  <div class="alert alert-danger">
                    <Text id="integration.androidTV.saveError" />
                  </div>
                )}
                <div class="form-group">
                  <label>
                    <Text id="integration.androidTV.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      value={props.androidTV.name}
                      onInput={this.updateAndroidTVName}
                      class="form-control"
                      placeholder={<Text id="integration.androidTV.namePlaceholder" />}
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label>
                    <Text id="integration.androidTV.roomLabel" />
                  </label>
                  <select onChange={this.updateAndroidTVRoom} class="form-control">
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {props.housesWithRooms &&
                      props.housesWithRooms.map(house => (
                        <optgroup label={house.name}>
                          {house.rooms.map(room => (
                            <option selected={room.id === props.androidTV.room_id} value={room.id}>
                              {room.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                  </select>
                </div>
                <div class="form-group">
                  <label>
                    <Text id="integration.androidTV.ipLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      value={get(props, 'androidTV.androidTVIP.value')}
                      onInput={this.updateAndroidTVIP}
                      class="form-control"
                      placeholder={<Text id="integration.androidTV.ipPlaceholder" />}
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <button onClick={this.saveAndroidTV} class="btn btn-success mr-2">
                    <Text id="integration.androidTV.saveButton" />
                  </button>
                  <button onClick={this.deleteAndroidTV} class="btn btn-danger">
                    <Text id="integration.androidTV.deleteButton" />
                  </button>
                </div>
                {props.androidTV.created_at && !props.androidTV.androidTVPaired.value && (
                  <div class="form-group">
                    <div class="input-group">
                      <label>
                        <Text id="integration.androidTV.codeDescription" />
                      </label>
                      <Localizer>
                        <input
                          type="text"
                          class="form-control"
                          placeholder={<Text id="integration.androidTV.codePlaceholder" />}
                          value={currentCodeTextInput}
                          onInput={this.updateCodeTextInput}
                        />
                      </Localizer>
                      <div class="input-group-append">
                        <button
                          type="button"
                          class="btn btn-secondary"
                          onClick={this.sendCode}
                          disabled={!currentCodeTextInput || currentCodeTextInput.length === 0}
                        >
                          <i class="fe fe-link" />
                        </button>
                      </div>
                    </div>
                    <div class="input-group">
                      <label>
                        <Text id="integration.androidTV.retryButtonDescription" />
                      </label>
                      <button onClick={this.reconnect} class="btn btn-info mr-2">
                        <Text id="integration.androidTV.retryButton" />
                      </button>
                    </div>
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
export default AndroidTVBox;
