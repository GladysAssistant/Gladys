import { Component } from 'preact';
import leaflet from 'leaflet';

const icon = leaflet.icon({
  iconUrl: '/assets/leaflet/marker-icon.png',
  iconRetinaUrl: '/assets/leaflet/marker-icon-2x.png',
  shadowUrl: '/assets/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

const DEFAULT_COORDS = [48.8583, 2.2945];

class MapComponent extends Component {
  initMap = () => {
    if (this.leafletMap) {
      this.leafletMap.remove();
    }
    let coordinates;
    if (this.props.house.latitude && this.props.house.longitude) {
      coordinates = [this.props.house.latitude, this.props.house.longitude];
    } else {
      coordinates = DEFAULT_COORDS;
    }
    this.leafletMap = leaflet.map(this.map).setView(coordinates, 2);
    leaflet
      .tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://cartodb.com/attributions">CartoDB</a>',
        subdomains: 'abcd',
        maxZoom: 19
      })
      .addTo(this.leafletMap);
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

  setPinMap = (latitude, longitude) => {
    if (this.houseMarker) {
      this.houseMarker.setLatLng(leaflet.latLng(latitude, longitude));
    } else {
      this.houseMarker = leaflet
        .marker([latitude, longitude], {
          icon
        })
        .addTo(this.leafletMap);
    }
  };

  setMapRef = map => {
    this.map = map;
  };
  constructor(props) {
    super(props);
    this.props = props;
  }

  componentDidMount() {
    this.initMap();
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
