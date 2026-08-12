import { Component } from 'preact';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import uuid from 'uuid';

import { RequestStatus } from '../../../../../utils/consts';

import actions from '../device-page/actions';
import BroadlinkPage from '../BroadlinkPage';
import DeviceNotFound from './DeviceNotFound';

import style from '../style.css';
import RemoteCreation from './RemoteCreation';

import { PARAMS } from '../../../../../../../server/services/broadlink/lib/utils/broadlink.constants';
import UpdateDevice from '../../../../../components/device/UpdateDevice';

const BROADLINK_PAGE_PATH = '/dashboard/integration/device/broadlink';

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
    let isRemote;

    if (deviceSelector) {
      try {
        const options = { service: 'broadlink' };
        device = await this.props.httpClient.get(`/api/v1/device/${deviceSelector}`, options);

        const peripheralParam = device.params.find(param => param.name === PARAMS.PERIPHERAL);
        if (peripheralParam) {
          peripheral = peripheralParam.value;
        }

        const remoteType = device.params.find(param => param.name === PARAMS.PERIPHERAL);
        isRemote = !!remoteType;
      } catch (e) {
        // Device not found
        loading = RequestStatus.Error;
      }
    } else {
      isRemote = true;
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
      peripheral,
      isRemote
    });
  }

  render(props, { loading, device, peripheral, isRemote }) {
    return (
      <BroadlinkPage user={props.user}>
        <div
          class={cx('dimmer', {
            active: loading === RequestStatus.Getting
          })}
        >
          <div class={cx('loader', 'bg-white', 'w-100', 'card', style.emptyDiv, style.emptyStateDivBox)} />
          <div class={cx('dimmer-content', style.emptyDiv)}>
            {loading === RequestStatus.Error && <DeviceNotFound />}
            {loading === RequestStatus.Success && isRemote && (
              <RemoteCreation {...props} device={device} peripheral={peripheral} />
            )}
            {loading === RequestStatus.Success && !isRemote && (
              <UpdateDevice
                {...props}
                device={device}
                integrationName="broadlink"
                allowModifyFeatures={false}
                previousPage={BROADLINK_PAGE_PATH}
              />
            )}
          </div>
        </div>
      </BroadlinkPage>
    );
  }
}

export default connect(
  'session,user,httpClient,currentIntegration,housesWithRooms,broadlinkPeripherals',
  actions
)(BroadlinkDeviceSetupPage);
