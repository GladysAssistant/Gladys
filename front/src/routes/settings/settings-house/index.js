import { Component } from 'preact';
import { connect } from 'unistore/preact';
import HousePage from './HousePage';
import actions from '../../../actions/house';

class SettingsHouses extends Component {
  componentWillMount() {
    this.props.getHouses();
  }

  render(props, {}) {
    return <HousePage {...props} />;
  }
}

export default connect(
  'user,houses,housesSearch,housesGetStatus,houseUpdateStatus,getHousesOrderDir,housesSearch',
  actions
)(SettingsHouses);
