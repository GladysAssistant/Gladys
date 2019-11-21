import { Component } from 'preact';
import { connect } from 'unistore/preact';

import actions from './actions';
import Layout from './Layout';
import SetupPanel from './SetupPanel';
import DevicePanel from './DevicePanel';
import { WEBSOCKET_MESSAGE_TYPES, EVENTS } from '../../../../../../server/utils/constants';

@connect('user,session,devices,houses,getDevicesStatus,deviceSearch', actions)
class Page extends Component {
  componentWillMount() {
    this.props.getHouses();
    this.props.getDevices();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_DEVICE, payload => {
      console.debug("New device: " + payload)
      //this.props.getDevices();
    });
    this.props.session.dispatcher.addListener(EVENTS.DEVICE.NEW_STATE, payload => {
      //console.debug("-------------------------------------------")
      //console.debug("New state : " + JSON.stringify(payload));
      //this.props.updateDevices();
    });
  }

  render(props, {}) {
    return (
      <Layout>
        {props.devices && props.devices.length ? <DevicePanel {...props} /> : <SetupPanel {...props}/>}        
      </Layout>
    );
  }
}

export default Page;
