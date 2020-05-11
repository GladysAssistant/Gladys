import {Component} from 'preact';
import {connect} from 'unistore/preact';
import actions from './actions';
import HeatzyPage from '../HeatzyPage';
import DiscoverTab from './DiscoverTab';
import {WEBSOCKET_MESSAGE_TYPES} from '../../../../../../../server/utils/constants';

@connect('user,session,housesWithRooms,heatzyDevices,discoverHeatzy,discoverHeatzyError', actions)
class HeatzyDiscoverPage extends Component {
  componentWillMount() {
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.HEATZY.DISCOVER, payload => {
      this.props.setDiscoveredDevices(payload);
    });
    this.props.getHouses();
    this.props.getIntegrationByName('heatzy');
  }

  render(props, {}) {
    return (
      <HeatzyPage>
        <DiscoverTab {...props} />
      </HeatzyPage>
    );
  }
}

export default HeatzyDiscoverPage;
