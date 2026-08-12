import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../../actions/map';
import update from 'immutability-helper';
import Map from './Map';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../server/utils/constants';

class MapPage extends Component {
  getUsersWithLocation = async () => {
    try {
      const usersWithLocation = await this.props.httpClient.get(
        '/api/v1/user?fields=id,firstname,selector,picture,last_latitude,last_longitude,last_altitude,last_accuracy,last_location_changed'
      );
      this.setState({
        usersWithLocation
      });
    } catch (e) {
      console.error(e);
    }
  };
  getHousesWithLocation = async () => {
    try {
      const housesWithLocation = await this.props.httpClient.get('/api/v1/house');
      this.setState({
        housesWithLocation
      });
    } catch (e) {
      console.error(e);
    }
  };
  getAreas = async () => {
    try {
      const areas = await this.props.httpClient.get('/api/v1/area');
      this.setState({
        areas
      });
    } catch (e) {
      console.error(e);
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
      areas: []
    };
  }

  componentDidMount() {
    this.getUsersWithLocation();
    this.getHousesWithLocation();
    this.getAreas();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.LOCATION.NEW, this.updateUserLocationWebsocket);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.LOCATION.NEW,
      this.updateUserLocationWebsocket
    );
  }

  render(props, { housesWithLocation, usersWithLocation, areas }) {
    return (
      <div class="page">
        <div class="page-main">
          <div class="my-3 my-md-5">
            <div class="map-header">
              <Map users={usersWithLocation} houses={housesWithLocation} areas={areas} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('session,httpClient', actions)(MapPage);
