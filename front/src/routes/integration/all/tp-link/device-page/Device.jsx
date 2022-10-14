import { Text, MarkupText } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import get from 'get-value';

import { RequestStatus } from '../../../../../utils/consts';
import DeviceForm from './DeviceForm';

class TpLinkDeviceBox extends Component {
  saveDevice = async () => {
    this.setState({ loading: true, saveError: null, deleteError: null });
    try {
      await this.props.saveDevice(this.props.device, this.props.deviceIndex);
    } catch (e) {
      this.setState({ saveError: RequestStatus.Error });
    }
    this.setState({ loading: false });
  };

  deleteDevice = async () => {
    this.setState({
      loading: true,
      saveError: null,
      deleteError: null,
      tooMuchStatesError: false,
      statesNumber: undefined
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
        this.setState({ deleteError: RequestStatus.Error });
      }
    }
    this.setState({ loading: false });
  };

  render(props, { loading, saveError, deleteError, tooMuchStatesError, statesNumber }) {
    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">{props.device.name || <Text id="integration.tpLink.device.noNameLabel" />}</div>
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body">
                {tooMuchStatesError && (
                  <div class="alert alert-warning">
                    <MarkupText id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />
                  </div>
                )}

                <DeviceForm {...props} />

                <div class="form-group">
                  <button onClick={this.saveDevice} class="btn btn-success mr-2">
                    <Text id="integration.tpLink.device.saveButton" />
                  </button>
                  <button onClick={this.deleteDevice} class="btn btn-danger mr-2">
                    <Text id="integration.tpLink.device.deleteButton" />
                  </button>
                </div>

                {saveError && (
                  <div class="alert alert-danger">
                    <Text id="integration.tpLink.device.saveError" />
                  </div>
                )}
                {deleteError && (
                  <div class="alert alert-danger">
                    <Text id="integration.tpLink.device.deleteError" />
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

export default TpLinkDeviceBox;
