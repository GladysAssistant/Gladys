import { Component } from 'preact';
import { connect } from 'unistore/preact';
import SignupLayout from '../layout';
import ConfigureHouseTab from './ConfigureHouseTab';
import actions from '../../../actions/signup/signupConfigureHouse';
import 'leaflet/dist/leaflet.css';

@connect(
  'signupRooms,signupNewHouseName,signupNewRoomName,signupConfigureHouseErrors',
  actions
)
class ConfigureHouse extends Component {
  componentWillMount() {
    this.props.initRoomList();
  }
  componentDidMount() {
    this.props.initLeafletMap();
  }
  render(props, {}) {
    return (
      <SignupLayout>
        <ConfigureHouseTab {...props} />
      </SignupLayout>
    );
  }
}

export default ConfigureHouse;
