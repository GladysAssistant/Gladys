import { Component } from 'preact';
import leaflet from 'leaflet';
//import 'leaflet-toolbar';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
//import 'leaflet-draw-toolbar/dist/leaflet.draw-toolbar.js';
import 'leaflet/dist/leaflet.css';
//import 'leaflet-toolbar/dist/leaflet.toolbar.css';
//import 'leaflet-draw-toolbar/dist/leaflet.draw-toolbar.css';
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

    this.displayAreas();
    this.displayUsers();
    this.displayToolbar();
    //this.displayPositionOptions();

  };

  displayToolbar = () => {
    var map = this.leafletMap;
    var drawnItems = new L.FeatureGroup().addTo(this.leafletMap);
    map.addLayer(drawnItems);
    // Initialise the draw control and pass it the FeatureGroup of editable layers
    var options = {
      draw: {
          polyline:  false,
          circle: {
            shapeOptions: {
              color: "#FF5656"
            }
          },
          polygon: false,
          marker: false,
          circlemarker: false,
          rectangle: false,
      },
      edit: {
          featureGroup: drawnItems
      }
    };
    // Truncate value based on number of decimals
    var _round = function(num, len) {
        return Math.round(num*(Math.pow(10, len)))/(Math.pow(10, len));
    };
    // Helper method to format LatLng object (x.xxxxxx, y.yyyyyy)
    var strLatLng = function(latlng) {
        return "("+_round(latlng.lat, 6)+", "+_round(latlng.lng, 6)+")";
    };
    var drawControl = new L.Control.Draw(options);
    map.addControl(drawControl);

    // Generate popup content based on layer type
    var getPopupContent = function(layer) {
        // Marker - add lat/long
        const latlng = layer.getLatLng();
        const latitude = latlng.lat;
        const longitude = latlng.lng;
        const radius = _round(layer.getRadius(), 2);
        return `<fieldset>
        <legend>Area details</legend>
          <input name="title" />
          <div><label class="form-label">Coordonates :</label> ( ${latitude},${longitude} )</div>
          <div><label class="form-label">Radius : </label>${radius}m </div>
          <div class="form-footer">
            <button
              onClick="/api/v1/area"
              class="btn btn-primary btn-block"
            >
              Valider
            </button>
          </div>
        </fieldset>`;
    };

    map.on(L.Draw.Event.CREATED, function (e) {

       var type = e.layerType,
           layer = e.layer;

       var content = getPopupContent(layer);
        if (content !== null) {
            layer.bindPopup(content);
        }
       if (type === 'marker') {
           // Do marker specific actions
           console.log('Marker');

       }
       // Do whatever else you need to. (save to db; add to map etc)
       console.log('CREATED');
       console.log(layer.getLatLng());
       const latlng = layer.getLatLng();

       drawnItems.addLayer(layer);
       map.addLayer(layer);
    });
    map.on(L.Draw.Event.DELETED, function (e) {
       var type = e.layerType,
           layer = e.layer;
       if (type === 'marker') {
           // Do marker specific actions
           console.log('DELETED');
       }
       // Do whatever else you need to. (save to db; add to map etc)
       console.log('DELETED');
    });
  };


  displayPositionOptions = () => {
    const CenterToHouseAction = L.Toolbar2.Action.extend({
            initialize: function(map, myAction) {
                this.map = map;
                L.Toolbar2.Action.prototype.initialize.call(this);
            },
            options: {
                toolbarIcon: {
                    html: '&#9873;',
                    tooltip: 'Go to the Eiffel Tower'
                }
            },

            addHooks: function () {
                this.map.setView([48.85815, 2.29420], 19);
            }

        });

    new L.Toolbar2.Control({
        actions: [CenterToHouseAction]
    }).addTo(this.leafletMap);
  };

  displayUsers = () => {
    if (this.props.users) {
      this.props.users.forEach(user => {
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
            .bindTooltip(`${user.firstname} ${user.lastname}`)
            .addTo(this.leafletMap);
          this.markerArray.push(this.userMarkers[user.id]);
        }
      });
    }
  };

  displayHouses = () => {
    if (this.props.houses) {
      this.props.houses.forEach(house => {
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

  displayAreas = () => {
    if (this.props.areas) {
      this.props.areas.forEach(area => {
        if (this.areaMarkers[area.id]) {
          this.areaMarkers[area.id].remove();
        }
        if (area.latitude && area.longitude) {
          this.areaMarkers[area.id] = leaflet
            .circle([area.latitude, area.longitude], {
              color: "${area.color}",
              fillColor: "${area.color}",
              fillOpacity: 0.5,
              radius: area.radius
              })
            .bindTooltip(`${area.name}`)
            .addTo(this.leafletMap);

          this.markerArray.push(this.areaMarkers[area.id]);
        }
      });
    }
  };

  setMapRef = map => {
    this.map = map;
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.userMarkers = {};
    this.houseMarkers = {};
    this.areaMarkers = {};
    this.markerArray = [];
  }

  componentDidMount() {
    this.initMap();
  }

  componentDidUpdate() {
    this.markerArray = [];
    this.displayHouses();
    this.displayAreas();
    this.displayUsers();
    if (this.markerArray.length >= 1) {
      const group = leaflet.featureGroup(this.markerArray);
      this.leafletMap.fitBounds(group.getBounds(), { padding: [150, 150] });
    }
  }

  componentWillUnmount() {
    if (this.leafletMap) {
      this.leafletMap.remove();
    }
  }

  render(props) {
    return <div ref={this.setMapRef} style="height: 500px;" />;
  }
}

export default MapComponent;
