import { Component } from 'preact';
import leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import style from './style.css';

const DEFAULT_COORDS = [48.8583, 2.2945];

class MapComponent extends Component {
  initMap = () => {
    if (this.leafletMap) {
      this.leafletMap.remove();
    }
    this.leafletMap = leaflet.map(this.map).setView(DEFAULT_COORDS, 2);
    leaflet
      .tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://cartodb.com/attributions">CartoDB</a>',
        subdomains: 'abcd',
        maxZoom: 19
      })
      .addTo(this.leafletMap);

    this.displayHouses();
    this.displayUsers();
  };

  displayUsers = () => {
    if (this.props.users) {
      this.props.users.forEach(user => {
        if (this.userMarkers[user.id]) {
          this.userMarkers[user.id].remove();
        }
        if (user.last_latitude && user.last_longitude) {
          this.userMarkers[user.id] = leaflet
            .marker([user.last_latitude, user.last_longitude], {
              icon: leaflet.icon({
                iconUrl: user.picture,
                iconSize: [40, 40],
                className: style.userIconImage
              }),
              zIndexOffset: 1000
            })
            .addTo(this.leafletMap);
        }
      });
    }
  };

  displayHouses = () => {
    if (this.props.houses) {
      this.props.houses.forEach(house => {
        if (this.houseMarkers[house.id]) {
          this.houseMarkers[house.id].remove();
        }
        if (house.latitude && house.longitude) {
          this.houseMarkers[house.id] = leaflet
            .marker([house.latitude, house.longitude], {
              icon: leaflet.icon({
                iconUrl: '/assets/images/home-icon.png',
                iconSize: [40, 40],
                className: style.houseIconImage
              })
            })
            .addTo(this.leafletMap);
        }
      });
    }
  };

  setMapRef = map => {
    this.map = map;
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.userMarkers = {};
    this.houseMarkers = {};
  }

  componentDidMount() {
    this.initMap();
  }

  componentDidUpdate() {
    this.displayHouses();
    this.displayUsers();
  }

  componentWillUnmount() {
    if (this.leafletMap) {
      this.leafletMap.remove();
    }
  }

  render(props) {
    return <div ref={this.setMapRef} style="height: 500px;" />;
  }
}

export default MapComponent;
