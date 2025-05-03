import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';

import style from './style.css';

const DEFAULT_COORDS = [48.8583, 2.2945];

let leaflet = null;
const getLeaflet = async () => {
  if (!leaflet) {
    const L = await import('leaflet');
    leaflet = L.default;
  }
  return leaflet;
};

class MapComponent extends Component {
  initMap = async () => {
    const L = await getLeaflet();

    if (this.leafletMap) {
      this.leafletMap.remove();
    }
    this.leafletMap = L.map(this.map).setView(DEFAULT_COORDS, 2);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://cartodb.com/attributions">CartoDB</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.leafletMap);
    await this.displayAll(this.props);
  };

  displayUsers = async props => {
    const L = await getLeaflet();
    if (props.users) {
      props.users.forEach(user => {
        if (this.userMarkers[user.id]) {
          this.userMarkers[user.id].remove();
        }
        if (user.last_latitude && user.last_longitude) {
          this.userMarkers[user.id] = L.marker([user.last_latitude, user.last_longitude], {
            icon: L.icon({
              iconUrl: user.picture,
              iconSize: [40, 40],
              className: style.userIconImage
            }),
            zIndexOffset: 1000
          }).addTo(this.leafletMap);
          this.markerArray.push(this.userMarkers[user.id]);
        }
      });
    }
  };

  displayAll = async props => {
    const L = await getLeaflet();
    this.markerArray = [];
    await this.displayHouses(props);
    await this.displayUsers(props);
    await this.displayAreas(props);
    if (this.markerArray.length >= 1) {
      const group = L.featureGroup(this.markerArray);
      this.leafletMap.fitBounds(group.getBounds(), { padding: [150, 150] });
    }
  };

  displayHouses = async props => {
    const L = await getLeaflet();
    if (props.houses) {
      props.houses.forEach(house => {
        if (this.houseMarkers[house.id]) {
          this.houseMarkers[house.id].remove();
        }
        if (house.latitude && house.longitude) {
          this.houseMarkers[house.id] = L.marker([house.latitude, house.longitude], {
            icon: L.icon({
              iconUrl: '/assets/images/home-icon.png',
              iconSize: [40, 40],
              className: style.houseIconImage
            })
          }).addTo(this.leafletMap);
          this.markerArray.push(this.houseMarkers[house.id]);
        }
      });
    }
  };

  displayAreas = async props => {
    const L = await getLeaflet();
    if (props.areas) {
      props.areas.forEach(area => {
        if (this.areaMarkers[area.id]) {
          this.areaMarkers[area.id].remove();
        }
        this.areaMarkers[area.id] = L.circle([area.latitude, area.longitude], {
          radius: area.radius,
          color: area.color,
          fillColor: area.color,
          fillOpacity: 0.2
        }).addTo(this.leafletMap);
        this.markerArray.push(this.areaMarkers[area.id]);

        this.areaMarkers[area.id].bindTooltip(area.name).openTooltip();

        this.areaMarkers[area.id].on('click', () => {
          route(`/dashboard/maps/area/edit/${area.selector}`);
        });
      });
    }
  };

  openNewAreaView = () => {
    route('/dashboard/maps/area/new');
  };

  setMapRef = map => {
    this.map = map;
  };
  updateDimensions = () => {
    const largeWindowOffset = 120;
    const smallWindowOffset = 65;
    const height =
      window.innerWidth >= 992 ? window.innerHeight - largeWindowOffset : window.innerHeight - smallWindowOffset;
    this.setState({ height });
  };

  constructor(props) {
    super(props);
    this.props = props;
    this.userMarkers = {};
    this.houseMarkers = {};
    this.areaMarkers = {};
    this.markerArray = [];
  }

  componentWillMount() {
    this.updateDimensions();
  }

  async componentDidMount() {
    await this.initMap();
    window.addEventListener('resize', this.updateDimensions.bind(this));
  }

  async componentWillReceiveProps(nextProps) {
    await this.displayAll(nextProps);
  }

  componentWillUnmount() {
    if (this.leafletMap) {
      this.leafletMap.remove();
    }
    window.removeEventListener('resize', this.updateDimensions.bind(this));
  }

  render(props, { height }) {
    return (
      <div ref={this.setMapRef} style={{ height: `${height}px` }}>
        <div class="leaflet-top leaflet-right">
          <button
            href="/dashboard/maps/area/new"
            class="btn btn-primary"
            onClick={this.openNewAreaView}
            style={{ marginTop: '10px', marginRight: '10px', pointerEvents: 'auto' }}
          >
            <Text id="newArea.createNewZoneButton" />
          </button>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(MapComponent);
