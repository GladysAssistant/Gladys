import { Component } from 'preact';
import leaflet from 'leaflet';

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

  componentDidMount() {
    this.initMap(this.props);
  }

  componentWillReceiveProps(nextProps) {
    const radiusChanged = nextProps.radius !== this.props.radius;
    const colorChanged = nextProps.color !== this.props.color;
    const latitudeChanged = nextProps.latitude !== this.props.latitude;
    const longitudeChanged = nextProps.longitude !== this.props.longitude;
    const latitudeLongitudeValid = nextProps.latitude && nextProps.longitude;
    if (latitudeLongitudeValid) {
      if (radiusChanged || colorChanged || latitudeChanged || longitudeChanged) {
        this.setPinMap(nextProps);
      }
    }
  }

  componentWillUnmount() {
    if (this.leafletMap) {
      this.leafletMap.remove();
    }
  }

  render(props) {
    return <div ref={this.setMapRef} style="width: 100%; height: 300px; z-index: 1" />;
  }
}

export default MapComponent;
