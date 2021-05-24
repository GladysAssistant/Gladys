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
    this.setPinMap(e.latlng.lat, e.latlng.lng);
  };

  setPinMap = (latitude, longitude) => {
    if (this.areaCircle) {
      this.areaCircle.setLatLng(leaflet.latLng(latitude, longitude));
    } else {
      this.areaCircle = leaflet
        .circle([latitude, longitude], {
          radius: this.state.radius,
          color: this.state.color,
          fillColor: this.state.color,
          fillOpacity: 0.2
        })
        .addTo(this.leafletMap);
    }
    this.setState({ latitude, longitude });
  };

  setMapRef = map => {
    this.map = map;
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      radius: 20,
      color: '#f03'
    };
  }

  componentDidMount() {
    this.initMap();
  }

  componentWillUnmount() {
    if (this.leafletMap) {
      this.leafletMap.remove();
    }
  }

  render(props) {
    return <div ref={this.setMapRef} style="width: 100%; height: 300px;" />;
  }
}

export default MapComponent;
