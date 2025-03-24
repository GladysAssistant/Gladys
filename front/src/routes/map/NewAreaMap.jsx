import { Component } from 'preact';
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
    this.leafletMap.on('click', this.onClickOnMap);
  };

  onClickOnMap = e => {
    this.props.setLatLong(e.latlng.lat, e.latlng.lng);
  };

  setPinMap = async props => {
    const L = await getLeaflet();

    if (this.areaCircle) {
      this.areaCircle.remove();
    } else if (!props.creationMode) {
      this.leafletMap.flyTo([props.latitude, props.longitude], 17, {
        duration: 0.25
      });
    }
    this.areaCircle = L.circle([props.latitude, props.longitude], {
      radius: props.radius,
      color: props.color,
      fillColor: props.color,
      fillOpacity: 0.2
    }).addTo(this.leafletMap);
  };

  setMapRef = map => {
    this.map = map;
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
      if (this.markerArray.length > 0 && props.creationMode) {
        const group = L.featureGroup(this.markerArray);
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

  async componentDidMount() {
    await this.initMap(this.props);
    await this.displayHouses(this.props);
  }

  async componentWillReceiveProps(nextProps) {
    const housesChanged = nextProps.houses !== this.props.houses;
    const radiusChanged = nextProps.radius !== this.props.radius;
    const colorChanged = nextProps.color !== this.props.color;
    const latitudeChanged = nextProps.latitude !== this.props.latitude;
    const longitudeChanged = nextProps.longitude !== this.props.longitude;
    const latitudeLongitudeValid = nextProps.latitude !== null && nextProps.longitude !== null;
    if (latitudeLongitudeValid) {
      if (radiusChanged || colorChanged || latitudeChanged || longitudeChanged) {
        await this.setPinMap(nextProps);
      }
    }
    if (housesChanged) {
      await this.displayHouses(nextProps);
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
