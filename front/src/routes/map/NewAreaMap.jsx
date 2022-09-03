import { Component } from 'preact';
import leaflet from 'leaflet';
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
      if (this.markerArray.length > 0 && props.creationMode) {
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
    this.initMap(this.props);
    this.displayHouses(this.props);
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

export default MapComponent;
