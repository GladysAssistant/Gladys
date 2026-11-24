import { Component } from 'preact';
import { connect } from 'unistore/preact';
import SignupLayout from '../layout';
import ConfigureHouseTab from './ConfigureHouseTab';
import actions from '../../../actions/signup/signupConfigureHouse';
import { withMobileViewport } from '../../../components/mobile';
import 'leaflet/dist/leaflet.css';

class ConfigureHouse extends Component {
  componentWillMount() {
    this.props.initRoomList();
  }
  // The map of the desktop step is created by the store action on an element of that layout:
  // the phone step has its own map component (docs/specs/mobile-pages/onboarding.md, C.4)
  componentDidMount() {
    if (!this.props.isMobile) {
      this.props.initLeafletMap();
    }
  }
  componentDidUpdate(prevProps) {
    const backToDesktop = prevProps.isMobile && !this.props.isMobile;
    if (!this.props.isMobile && (backToDesktop || prevProps.darkMode !== this.props.darkMode)) {
      this.props.initLeafletMap();
    }
  }
  render(props, {}) {
    return (
      <SignupLayout currentUrl="/signup/configure-house">
        <ConfigureHouseTab {...props} />
      </SignupLayout>
    );
  }
}

export default withMobileViewport(
  connect(
    'signupRooms,signupNewHouseName,signupNewRoomName,signupConfigureHouseErrors,signupNewHouseLatitude,signupNewHouseLongitude,signupSaveHouse,darkMode',
    actions
  )(ConfigureHouse)
);
