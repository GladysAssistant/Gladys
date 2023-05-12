import { RequestStatus } from '../../utils/consts';
import { route } from 'preact-router';
import update from 'immutability-helper';
import leaflet from 'leaflet';
import JSConfetti from 'js-confetti';

const jsConfetti = new JSConfetti();

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

function createActions(store) {
  const actions = {
    initRoomList() {
      store.setState({
        signupRooms: []
      });
    },
    async initLeafletMap(state) {
      if (state.signupHouseLeafletMap) {
        state.signupHouseLeafletMap.remove();
      }
      const leafletMap = leaflet.map('select-house-location-map').setView([48.8583, 2.2945], 2);
      leaflet
        .tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://cartodb.com/attributions">CartoDB</a>',
          subdomains: 'abcd',
          maxZoom: 19
        })
        .addTo(leafletMap);
      leafletMap.on('click', e => {
        if (store.getState().signupNewHouseMarker) {
          store.getState().signupNewHouseMarker.setLatLng(e.latlng);
        } else {
          const marker = leaflet
            .marker([e.latlng.lat, e.latlng.lng], {
              icon
            })
            .addTo(leafletMap);
          store.setState({
            signupNewHouseMarker: marker,
            signupNewHouseLatitude: e.latlng.lat,
            signupNewHouseLongitude: e.latlng.lng
          });
        }
        store.setState({
          signupNewHouseLatitude: e.latlng.lat,
          signupNewHouseLongitude: e.latlng.lng
        });
      });
      store.setState({
        signupHouseLeafletMap: leafletMap
      });
    },
    onKeyPressRoomInput(state, e) {
      if (e.keyCode === 13) {
        actions.addRoom(state);
      }
    },
    addRoom(state) {
      const alreadyInArray = state.signupRooms && state.signupRooms.indexOf(state.signupNewRoomName) !== -1;
      if (state.signupNewRoomName && state.signupNewRoomName.length > 0 && !alreadyInArray) {
        const newState = update(state, {
          signupRooms: {
            $push: [state.signupNewRoomName]
          },
          signupNewRoomName: {
            $set: ''
          }
        });
        store.setState(newState);
      }
    },
    removeRoom(state, index) {
      const newState = update(state, {
        signupRooms: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    updateNewRoomName(state, e) {
      store.setState({
        signupNewRoomName: e.target.value
      });
    },
    updateNewHouseName(state, e) {
      store.setState({
        signupNewHouseName: e.target.value
      });
    },
    async saveHouse(state) {
      // validate new house
      let errored = false;
      const errors = {};
      if (!state.signupNewHouseName || state.signupNewHouseName.length === 0) {
        errored = true;
        errors.houseName = true;
      }
      // if house is errored
      if (errored) {
        return store.setState({
          signupConfigureHouseErrors: errors
        });
      }

      // create house
      store.setState({
        signupSaveHouse: RequestStatus.Getting
      });
      try {
        const createdHouse = await state.httpClient.post(`/api/v1/house`, {
          name: state.signupNewHouseName,
          latitude: state.signupNewHouseLatitude,
          longitude: state.signupNewHouseLongitude
        });

        // create all rooms
        const promises = state.signupRooms.map(room =>
          state.httpClient.post(`/api/v1/house/${createdHouse.selector}/room`, {
            name: room
          })
        );
        await Promise.all(promises);
        store.setState({
          signupSaveHouse: RequestStatus.Success
        });
        // Confetti for success!
        jsConfetti.addConfetti();
        route('/signup/success');
      } catch (e) {
        store.setState({
          signupSaveHouse: RequestStatus.Error
        });
      }
    }
  };
  return actions;
}

export default createActions;
