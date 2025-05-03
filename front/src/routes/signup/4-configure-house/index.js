import { Component } from 'preact';
import { connect } from 'unistore/preact';
import SignupLayout from '../layout';
import ConfigureHouseTab from './ConfigureHouseTab';
import actions from '../../../actions/signup/signupConfigureHouse';

class ConfigureHouse extends Component {
  componentWillMount() {
    this.props.initRoomList();
  }
  componentDidMount() {
    this.props.initLeafletMap();
  }
  render(props, {}) {
    return (
      <SignupLayout currentUrl="/signup/configure-house">
        <ConfigureHouseTab {...props} />
      </SignupLayout>
    );
  }
}

export default connect(
  'signupRooms,signupNewHouseName,signupNewRoomName,signupConfigureHouseErrors',
  actions
)(ConfigureHouse);
