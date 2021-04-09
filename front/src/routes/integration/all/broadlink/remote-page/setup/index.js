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

import { PARAMS } from '../../../../../../../../server/services/broadlink/lib/utils/broadlink.constants';

@connect('session,user,httpClient,currentIntegration,houses,broadlinkPeripherals', actions)
class BroadlinkDeviceSetupPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: RequestStatus.Getting
    };
  }

  async componentWillMount() {
    let { deviceSelector, peripheral } = this.props;
    let device;
    let loading = RequestStatus.Success;

    if (deviceSelector) {
      try {
        const options = { service: 'broadlink' };
        device = await this.props.httpClient.get(`/api/v1/device/${deviceSelector}`, options);

        const peripheralParam = device.params.find(param => param.name === PARAMS.PERIPHERAL);
        if (peripheralParam) {
          peripheral = peripheralParam.value;
        }
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
      device,
      peripheral
    });
  }

  render({ error, ...props }, { loading, device, peripheral }) {
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
            {loading === RequestStatus.Success && <RemoteCreation {...props} device={device} peripheral={peripheral} />}
          </div>
        </div>
      </BroadlinkPage>
    );
  }
}

export default BroadlinkDeviceSetupPage;
