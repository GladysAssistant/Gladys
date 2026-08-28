import { Component } from 'preact';
import leaflet from 'leaflet';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import cx from 'classnames';

import 'leaflet/dist/leaflet.css';
import { addMapTileLayer } from '../../utils/mapTileLayer';
import style from './style.css';
import { route } from 'preact-router';

const DEFAULT_COORDS = [48.8583, 2.2945];

class MapComponent extends Component {
  initMap = () => {
    if (this.leafletMap) {
      this.leafletMap.remove();
    }
    this.leafletMap = leaflet.map(this.map).setView(DEFAULT_COORDS, 2);

    // Use the global dark mode state from props
    addMapTileLayer(this.leafletMap, this.props.darkMode);
    this.displayAll(this.props);
  };

  displayUsers = props => {
    if (props.users) {
      props.users.forEach(user => {
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

  displayAll = props => {
    this.markerArray = [];
    this.displayHouses(props);
    this.displayUsers(props);
    this.displayAreas(props);
    if (this.markerArray.length >= 1) {
      const group = leaflet.featureGroup(this.markerArray);
      this.leafletMap.fitBounds(group.getBounds(), { padding: [150, 150] });
    }
  };

  displayHouses = props => {
    if (props.houses) {
      props.houses.forEach(house => {
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

  displayAreas = async props => {
    if (props.areas) {
      // The handles below live above the marker pane (z-index 600), so a
      // user avatar sitting at a zone's center cannot cover them and
      // swallow their clicks. 620 stays below the tooltip pane (650).
      if (!this.leafletMap.getPane('areaHandles')) {
        this.leafletMap.createPane('areaHandles').style.zIndex = 620;
      }
      props.areas.forEach(area => {
        if (this.areaMarkers[area.id]) {
          this.areaMarkers[area.id].remove();
        }
        const areaCircle = leaflet.circle([area.latitude, area.longitude], {
          radius: area.radius,
          color: area.color,
          fillColor: area.color,
          fillOpacity: 0.2
        });
        // The circle above has a geographic size: a small zone is sub-pixel
        // as soon as the map is zoomed out, so it cannot be seen or clicked
        // to be edited or deleted. This fixed screen-size handle keeps every
        // zone visible and clickable at any zoom level.
        const areaHandle = leaflet.circleMarker([area.latitude, area.longitude], {
          radius: 9,
          color: area.color,
          weight: 2,
          fillColor: area.color,
          fillOpacity: 0.4,
          pane: 'areaHandles'
        });
        this.areaMarkers[area.id] = leaflet.featureGroup([areaCircle, areaHandle]).addTo(this.leafletMap);
        this.markerArray.push(this.areaMarkers[area.id]);

        areaHandle.bindTooltip(area.name, { permanent: true });

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
    // The map fills everything below the chrome: nothing on desktop (the nav
    // is the left sidebar), the 3.25rem fixed top bar on mobile
    const largeWindowOffset = 0;
    const smallWindowOffset = 52;
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

  componentDidMount() {
    this.initMap();
    window.addEventListener('resize', this.updateDimensions.bind(this));
  }

  componentDidUpdate(prevProps) {
    // If dark mode state has changed, reinitialize the map
    if (prevProps.darkMode !== this.props.darkMode) {
      this.initMap();
    } else {
      // If other props changed, update markers
      this.displayAll(this.props);
    }
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
          {/* .leaflet-control restores pointer events and the corner margins;
              btn-primary stays for behavior and the e2e tests, the Horizon
              frosted pill wins the styling */}
          <div class="leaflet-control">
            <button class={cx('btn', 'btn-primary', style.pillButton)} onClick={this.openNewAreaView}>
              <i class="fe fe-plus" />
              <Text id="newArea.createNewZoneButton" />
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient,darkMode', {})(MapComponent);
