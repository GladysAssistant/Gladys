import { Component } from 'preact';
import leaflet from 'leaflet';

import 'leaflet/dist/leaflet.css';
import style from './style.css';
import { route } from 'preact-router';

const DEFAULT_COORDS = [48.8583, 2.2945];

class MapComponent extends Component {
  onMapClick = e => {
    let popup = leaflet.popup();
    popup
      .setLatLng(e.latlng)
      .setContent(`You clicked the map at ${e.latlng.toString()}`)
      .openOn(this.leafletMap);
  };
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
    //this.leafletMap.on('click', this.onMapClick);
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
          this.markerArray.push(this.userMarkers[user.id]);
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
          this.markerArray.push(this.houseMarkers[house.id]);
        }
      });
    }
  };

  openNewAreaView = () => {
    route('/dashboard/maps/area/new');
  };

  setMapRef = map => {
    this.map = map;
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.userMarkers = {};
    this.houseMarkers = {};
    this.markerArray = [];
  }

  componentDidMount() {
    this.initMap();
  }

  componentDidUpdate() {
    this.markerArray = [];
    this.displayHouses();
    this.displayUsers();
    if (this.markerArray.length >= 1) {
      const group = leaflet.featureGroup(this.markerArray);
      this.leafletMap.fitBounds(group.getBounds(), { padding: [150, 150] });
    }
  }

  componentWillUnmount() {
    if (this.leafletMap) {
      this.leafletMap.remove();
    }
  }

  render(props) {
    return (
      <div ref={this.setMapRef} style="height: 500px;">
        <div class="leaflet-top leaflet-right">
          <button
            href="/dashboard/maps/area/new"
            class="btn btn-primary"
            onClick={this.openNewAreaView}
            style={{ marginTop: '10px', marginRight: '10px', pointerEvents: 'auto' }}
          >
            Create new zone
          </button>
        </div>
      </div>
    );
  }
}

export default MapComponent;
