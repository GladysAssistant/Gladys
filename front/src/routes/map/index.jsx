import { Component } from 'preact';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import actions from '../../actions/map';
import update from 'immutability-helper';
import Map from './Map';
import style from './style.css';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../server/utils/constants';

class MapPage extends Component {
  getUsersWithLocation = async () => {
    try {
      return await this.props.httpClient.get(
        '/api/v1/user?fields=id,firstname,selector,picture,last_latitude,last_longitude,last_altitude,last_accuracy,last_location_changed'
      );
    } catch (e) {
      console.error(e);
      return [];
    }
  };
  getHousesWithLocation = async () => {
    try {
      return await this.props.httpClient.get('/api/v1/house');
    } catch (e) {
      console.error(e);
      return [];
    }
  };
  getAreas = async () => {
    try {
      return await this.props.httpClient.get('/api/v1/area');
    } catch (e) {
      console.error(e);
      return [];
    }
  };
  updateUserLocationWebsocket = event => {
    const userIndex = this.state.usersWithLocation.findIndex(user => user.id === event.id);
    if (userIndex !== -1) {
      const newState = update(this.state, {
        usersWithLocation: {
          [userIndex]: {
            last_latitude: {
              $set: event.last_latitude
            },
            last_longitude: {
              $set: event.last_longitude
            },
            last_location_changed: {
              $set: event.last_location_changed
            }
          }
        }
      });
      this.setState(newState);
    }
  };

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      usersWithLocation: [],
      housesWithLocation: [],
      areas: [],
      loaded: false
    };
  }

  loadMapData = async () => {
    // A single setState, so the markers and the first fit land together
    // instead of flashing on the world view while the requests complete
    const [usersWithLocation, housesWithLocation, areas] = await Promise.all([
      this.getUsersWithLocation(),
      this.getHousesWithLocation(),
      this.getAreas()
    ]);
    this.setState({ usersWithLocation, housesWithLocation, areas, loaded: true });
  };

  componentDidMount() {
    this.loadMapData();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.LOCATION.NEW, this.updateUserLocationWebsocket);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.LOCATION.NEW,
      this.updateUserLocationWebsocket
    );
  }

  render(props, { housesWithLocation, usersWithLocation, areas, loaded }) {
    // No wrapper margins (the tabler .map-header helper carries a negative
    // top margin meant for banner maps): the map fills everything below the
    // chrome, sizing itself to the viewport minus that chrome.
    // glass-theme provides the Horizon tokens the floating map chrome
    // (create-zone pill, Leaflet controls, tooltips) composes on.
    return (
      <div class="page">
        <div class={cx('page-main', 'glass-theme', style.mapPage)}>
          <Map users={usersWithLocation} houses={housesWithLocation} areas={areas} loaded={loaded} />
        </div>
      </div>
    );
  }
}

export default connect('session,httpClient', actions)(MapPage);
