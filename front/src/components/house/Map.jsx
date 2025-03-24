import { Component } from 'preact';

const DEFAULT_COORDS = [48.8583, 2.2945];

const icon = {
  iconUrl: '/assets/leaflet/marker-icon.png',
  iconRetinaUrl: '/assets/leaflet/marker-icon-2x.png',
  shadowUrl: '/assets/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
};

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
    let coordinates;
    if (this.props.house.latitude && this.props.house.longitude) {
      coordinates = [this.props.house.latitude, this.props.house.longitude];
    } else {
      coordinates = DEFAULT_COORDS;
    }
    this.leafletMap = L.map(this.map).setView(coordinates, 2);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://cartodb.com/attributions">CartoDB</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.leafletMap);
    this.leafletMap.on('click', this.onClickOnMap);

    // add house pin
    if (this.props.house.latitude && this.props.house.longitude) {
      this.setPinMap(this.props.house.latitude, this.props.house.longitude);
    }
  };

  onClickOnMap = e => {
    this.setPinMap(e.latlng.lat, e.latlng.lng);
    this.props.updateHouseLocation(e.latlng.lat, e.latlng.lng, this.props.houseIndex);
  };

  setPinMap = async (latitude, longitude) => {
    const L = await getLeaflet();
    if (this.houseMarker) {
      this.houseMarker.setLatLng(L.latLng(latitude, longitude));
    } else {
      this.houseMarker = L.marker([latitude, longitude], {
        icon: L.icon(icon)
      }).addTo(this.leafletMap);
    }
  };

  setMapRef = map => {
    this.map = map;
  };
  constructor(props) {
    super(props);
    this.props = props;
  }

  async componentDidMount() {
    await this.initMap();
  }

  componentWillUnmount() {
    if (this.leafletMap) {
      this.leafletMap.remove();
    }
  }

  render() {
    return <div ref={this.setMapRef} style="width: 100%; height: 300px;" />;
  }
}

export default MapComponent;
