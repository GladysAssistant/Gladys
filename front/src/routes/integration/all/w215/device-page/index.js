import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import W215Page from '../W215Page';
import DeviceTab from './DeviceTab';

@connect('user,w215Devices,housesWithRooms,getW215Status', actions)
class W215Integration extends Component {
  componentWillMount() {
    this.props.getW215Devices();
    this.props.getHouses();
    this.props.getIntegrationByName('w215');
  }

  render(props, {}) {
    return (
      <W215Page user={props.user}>
        <DeviceTab {...props} />
      </W215Page>
    );
  }
}

export default W215Integration;
