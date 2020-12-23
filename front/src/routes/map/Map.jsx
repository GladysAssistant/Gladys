import {render as htmlrendering} from 'preact-render-to-string';
import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { connect } from 'unistore/preact';
import update from 'immutability-helper';
import { route } from 'preact-router';
import Area from './Area';
import actions from '../../actions/map';

import leaflet from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet/dist/leaflet.css';
import style from './style.css';

const DEFAULT_COORDS = [48.8583, 2.2945];

@connect('session,httpClient', actions)
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
    this.props.updateAreaLocation("12", "45","55555", '1');
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
    var drawControl = new L.Control.Draw(options);
    map.addControl(drawControl);

    // Generate popup content based on layer type
    var getPopupContent = function(layer) {
        // Marker - add lat/long
        const latlng = layer.getLatLng();
        const latitude = latlng.lat;
        const longitude = latlng.lng;
        const radius = _round(layer.getRadius(), 2);
        return `
        <div class="form-group" style="width:250px;">
          <fieldset>
          <legend>Area details</legend>
              <div>
                <label class="form-label">Label :</label>
                <input class="form-control" placeholder="Title" name="title" />
              <div>
                <label class="form-label">Coordonates :</label>
              </div>
              <div>
              <input class="form-control" name="latitude" editable="false" value="${latitude}"/>
              <input class="form-control" name="longitude" editable="false" value="${longitude}"/>
              </div>
              <div>
                <label class="form-label">Radius(m) : </label>
                <input class="form-control" name="radius" value="${radius}"/>
              </div>
              <div class="form-footer">
                <button class="btn btn-primary mx-auto" onClick="">
                  Create
                </button>
            </div>
          </fieldset>
        </div>`;
    };


    // Truncate value based on number of decimals
    var _round = function(num, len) {
        return Math.round(num*(Math.pow(10, len)))/(Math.pow(10, len));
    };
    // Helper method to format LatLng object (x.xxxxxx, y.yyyyyy)
    var strLatLng = function(latlng) {
        return "("+_round(latlng.lat, 6)+", "+_round(latlng.lng, 6)+")";
    };
    let latitude = 0;
    let longitude = 0;
    let radius = 0;
    const updateAreaLocation = this.props.updateAreaLocation

    map.on(L.Draw.Event.CREATED, e => {
      var type = e.layerType,
          layer = e.layer;
      const latlng = layer.getLatLng();
      latitude = latlng.lat;
      longitude = latlng.lng;
      updateAreaLocation(latitude, longitude, layer.getRadius(), '1');

      layer.bindPopup(getPopupContent(layer));
      drawnItems.addLayer(layer);
      map.addLayer(layer);

    });

    map.on(L.Draw.Event.EDITED, e => {
      var layers = e.layers;
      layers.eachLayer(function (layer) {
        const latlng = layer.getLatLng();
        latitude = latlng.lat;
        longitude = latlng.lng;
        updateAreaLocation(latitude, longitude, layer.getRadius(), '1');
      });
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
