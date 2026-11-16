import { Component } from 'preact';
import { connect } from 'unistore/preact';
import leaflet from 'leaflet';
import { addMapTileLayer } from '../../utils/mapTileLayer';
import 'leaflet/dist/leaflet.css';

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
const WORLD_ZOOM = 2;
const LOCATED_ZOOM = 16;

// A map that only shows where the house is (the preview of the phone layout): no gesture is
// taken from the page it sits in
const STATIC_MAP_OPTIONS = {
  dragging: false,
  touchZoom: false,
  doubleClickZoom: false,
  scrollWheelZoom: false,
  boxZoom: false,
  keyboard: false,
  zoomControl: false
};

class MapComponent extends Component {
  initMap = () => {
    if (this.leafletMap) {
      this.leafletMap.remove();
      this.houseMarker = null;
    }
    let coordinates;
    if (this.props.house.latitude && this.props.house.longitude) {
      coordinates = [this.props.house.latitude, this.props.house.longitude];
    } else {
      coordinates = DEFAULT_COORDS;
    }
    const located = coordinates !== DEFAULT_COORDS;
    const interactive = this.props.interactive !== false;
    // `zoom`: how close a located house is shown when the map opens (the world, as always,
    // when the caller does not say)
    const zoom = located && this.props.zoom ? this.props.zoom : WORLD_ZOOM;
    this.leafletMap = leaflet.map(this.map, interactive ? {} : STATIC_MAP_OPTIONS).setView(coordinates, zoom);

    // Use the global dark mode state from props
    addMapTileLayer(this.leafletMap, this.props.darkMode);
    if (interactive) {
      this.leafletMap.on('click', this.onClickOnMap);
    }
    // a map sized by a class may be measured before its container settles (a sheet sliding in)
    if (this.props.class) {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => this.leafletMap && this.leafletMap.invalidateSize(), 320);
    }

    // add house pin
    if (this.props.house.latitude && this.props.house.longitude) {
      this.setPinMap(this.props.house.latitude, this.props.house.longitude);
    }
  };

  onClickOnMap = e => {
    // Leaflet repeats the world horizontally and gives the raw longitude of
    // the copy that was clicked, which can be outside -180/+180 (e.g. +236
    // instead of -124). Store the wrapped value, which every service expects,
    // but keep the clicked coordinates for the marker so that it stays under
    // the cursor instead of jumping to the main copy of the world.
    const { lat, lng } = e.latlng.wrap();
    this.setPinMap(e.latlng.lat, e.latlng.lng);
    this.props.updateHouseLocation(lat, lng, this.props.houseIndex);
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
    clearTimeout(this.resizeTimer);
    this.leafletMap.off('click', this.onClickOnMap);
    this.leafletMap.remove();
    this.leafletMap = null;
  }

  componentDidUpdate(prevProps) {
    // If dark mode state has changed, reinitialize the map
    if (prevProps.darkMode !== this.props.darkMode) {
      this.initMap();
      return;
    }
    // If the house location was changed from outside the map (address search),
    // move the pin and center the view on it. A click on the map already moved
    // the marker to this position, so it is skipped here.
    const { latitude, longitude } = this.props.house;
    const locationChanged = prevProps.house.latitude !== latitude || prevProps.house.longitude !== longitude;
    if (locationChanged && latitude && longitude) {
      // The marker may sit on a repeated copy of the world after a click, so
      // compare wrapped longitudes: the house always holds the wrapped one.
      const markerPosition = this.houseMarker && this.houseMarker.getLatLng().wrap();
      const markerAlreadyThere = markerPosition && markerPosition.lat === latitude && markerPosition.lng === longitude;
      if (!markerAlreadyThere) {
        this.setPinMap(latitude, longitude);
        this.leafletMap.setView([latitude, longitude], LOCATED_ZOOM);
      }
    }
  }

  render(props) {
    // the phone layouts size the map with a class (a preview, the map of a sheet)
    if (props.class) {
      return <div ref={this.setMapRef} class={props.class} />;
    }
    return <div ref={this.setMapRef} style="width: 100%; height: 300px;" />;
  }
}

export default connect('darkMode')(MapComponent);
