import { Component } from 'preact';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import uuid from 'uuid';

import { RequestStatus } from '../../../../../../utils/consts';

import actions from '../actions';
import BroadlinkPage from '../../BroadlinkPage';
import DeviceNotFound from './DeviceNotFound';

import style from '../../style.css';
import RemoteCreation from './RemoteCreation';

@connect('session,user,httpClient,currentIntegration,houses,broadlinkPeripherals', actions)
class BroadlinkDeviceSetupPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: RequestStatus.Getting
    };
  }

  async componentWillMount() {
    let { deviceSelector } = this.props;
    let device;
    let loading = RequestStatus.Success;

    if (deviceSelector) {
      try {
        const options = { service: 'broadlink' };
        device = await this.props.httpClient.get(`/api/v1/device/${deviceSelector}`, options);
      } catch (e) {
        // Device not found
        loading = RequestStatus.Error;
      }
    } else {
      device = {
        id: uuid.v4()
      };
    }

    if (loading === RequestStatus.Success) {
      await this.props.getHouses();
      await this.props.getIntegrationByName('broadlink');
      await this.props.getBroadlinkPeripherals();
    }

    this.setState({
      loading,
      device
    });
  }

  render({ error, ...props }, { loading, device }) {
    return (
      <BroadlinkPage>
        <div
          class={cx('dimmer', {
            active: loading === RequestStatus.Getting
          })}
        >
          <div class={cx('loader', style.emptyStateDivBox)} />
          <div class="dimmer-content">
            {loading === RequestStatus.Error && <DeviceNotFound />}
            {loading === RequestStatus.Success && <RemoteCreation {...props} device={device} />}
          </div>
        </div>
      </BroadlinkPage>
    );
  }
}

export default BroadlinkDeviceSetupPage;
