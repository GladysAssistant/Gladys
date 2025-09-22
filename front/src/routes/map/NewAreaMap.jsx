import { Component } from 'preact';
import leaflet from 'leaflet';
import { connect } from 'unistore/preact';
import style from './style.css';

const DEFAULT_COORDS = [48.8583, 2.2945];

class MapComponent extends Component {
  initMap = (options = {}) => {
    // Prepare center coordinates - can be array [lat, lng] or LatLng object
    let centerCoords = DEFAULT_COORDS; // Default coordinates as array
    let zoomLevel = 2; // Default zoom level

    if (options.center) {
      centerCoords = options.center;
    }

    if (options.zoom !== undefined) {
      zoomLevel = options.zoom;
    }

    if (this.leafletMap) {
      this.leafletMap.remove();
    }

    this.leafletMap = leaflet.map(this.map).setView(centerCoords, zoomLevel);

    // Use the global dark mode state from props
    const isDarkMode = this.props.darkMode;

    // Use dark tiles if dark mode is active, otherwise use light tiles
    // Force new tile layer by adding timestamp to URL to prevent caching
    const tileStyle = isDarkMode ? 'dark_all' : 'light_all';
    const timestamp = new Date().getTime();

    const tileUrl = `https://{s}.basemaps.cartocdn.com/${tileStyle}/{z}/{x}/{y}.png?_=${timestamp}`;

    leaflet
      .tileLayer(tileUrl, {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://cartodb.com/attributions">CartoDB</a>',
        subdomains: 'abcd',
        maxZoom: 19,
        noCache: true
      })
      .addTo(this.leafletMap);

    this.leafletMap.on('click', this.onClickOnMap);
  };

  onClickOnMap = e => {
    this.props.setLatLong(e.latlng.lat, e.latlng.lng);
  };

  setPinMap = props => {
    if (this.areaCircle) {
      this.areaCircle.remove();
    } else if (!props.creationMode) {
      this.leafletMap.flyTo([props.latitude, props.longitude], 17, {
        duration: 0.25
      });
    }
    this.areaCircle = leaflet
      .circle([props.latitude, props.longitude], {
        radius: props.radius,
        color: props.color,
        fillColor: props.color,
        fillOpacity: 0.2
      })
      .addTo(this.leafletMap);
  };

  setMapRef = map => {
    this.map = map;
  };

  displayHouses = (props, options = {}) => {
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
      if (this.markerArray.length > 0 && props.creationMode && !options.doNotFitBounds) {
        const group = leaflet.featureGroup(this.markerArray);
        this.leafletMap.fitBounds(group.getBounds(), { padding: [150, 150] });
      }
    }
  };

  constructor(props) {
    super(props);
    this.props = props;
    this.houseMarkers = {};
    this.markerArray = [];
  }

  componentDidMount() {
    // Initialize map with default values
    this.initMap();
    this.displayHouses(this.props);
  }

  componentDidUpdate(prevProps) {
    // If dark mode state has changed, reinitialize the map
    if (prevProps.darkMode !== this.props.darkMode) {
      // Save current area state if it exists
      let hadArea = false;
      let currentArea = null;

      // Save the current map view (center and zoom)
      const center = this.leafletMap.getCenter();
      const zoom = this.leafletMap.getZoom();

      if (this.areaCircle) {
        hadArea = true;
        const latlng = this.areaCircle.getLatLng();
        const radius = this.areaCircle.getRadius();
        currentArea = {
          latitude: latlng.lat,
          longitude: latlng.lng,
          radius,
          color: this.props.color || '#3498db' // Use current color or default
        };
      }

      // Reinitialize the map with the current view settings
      this.initMap({
        center: [center.lat, center.lng], // Pass as array format which Leaflet expects
        zoom
      });

      // Redisplay houses
      this.displayHouses(this.props, { doNotFitBounds: true });

      // Restore the area if it existed
      if (hadArea && currentArea) {
        this.setPinMap(currentArea);
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    const housesChanged = nextProps.houses !== this.props.houses;
    const radiusChanged = nextProps.radius !== this.props.radius;
    const colorChanged = nextProps.color !== this.props.color;
    const latitudeChanged = nextProps.latitude !== this.props.latitude;
    const longitudeChanged = nextProps.longitude !== this.props.longitude;
    const latitudeLongitudeValid = nextProps.latitude !== null && nextProps.longitude !== null;
    if (latitudeLongitudeValid) {
      if (radiusChanged || colorChanged || latitudeChanged || longitudeChanged) {
        this.setPinMap(nextProps);
      }
    }
    if (housesChanged) {
      this.displayHouses(nextProps);
    }
  }

  componentWillUnmount() {
    if (this.leafletMap) {
      this.leafletMap.remove();
    }
  }

  render() {
    return <div ref={this.setMapRef} style="width: 100%; height: 300px; z-index: 1" />;
  }
}

export default connect('darkMode', {})(MapComponent);
