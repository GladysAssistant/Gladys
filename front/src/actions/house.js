import { RequestStatus } from '../utils/consts';
import update, { extend } from 'immutability-helper';

extend('$auto', function(value, object) {
  return object ? update(object, value) : update({}, value);
});

import debounce from 'debounce';
import get from 'get-value';
import uuid from 'uuid';

function createActions(store) {
  const actions = {
    async getHouses(state) {
      store.setState({
        housesGetStatus: RequestStatus.Getting
      });
      const orderDir = state.getHousesOrderDir || 'asc';
      try {
        const params = {
          expand: 'rooms',
          order_dir: orderDir
        };
        if (state.housesSearch && state.housesSearch.length) {
          params.search = state.housesSearch;
        }
        const houses = await state.httpClient.get(`/api/v1/house`, params);
        store.setState({
          houses,
          housesGetStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          housesGetStatus: RequestStatus.Error
        });
      }
    },
    async search(state, e) {
      store.setState({
        housesSearch: e.target.value
      });
      await actions.getHouses(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getHousesOrderDir: e.target.value
      });
      await actions.getHouses(store.getState());
    },
    updateHouseName(state, name, houseIndex) {
      const newState = update(state, {
        houses: {
          [houseIndex]: {
            name: {
              $set: name
            }
          }
        }
      });
      store.setState(newState);
    },
    updateHouseLocation(state, latitude, longitude, houseIndex) {
      const newState = update(state, {
        houses: {
          [houseIndex]: {
            latitude: {
              $set: latitude
            },
            longitude: {
              $set: longitude
            }
          }
        }
      });
      store.setState(newState);
    },
    addRoom(state, name, houseIndex) {
      if (name.length === 0) {
        return null;
      }
      if (state.houses[houseIndex].rooms.find(room => room.name === name)) {
        return null;
      }
      const newRoom = {
        name
      };
      const newState = update(state, {
        houses: {
          [houseIndex]: {
            rooms: {
              $push: [newRoom]
            }
          }
        }
      });
      store.setState(newState);
    },
    removeRoom(state, houseIndex, roomIndex) {
      let action;
      // if the room already exist in DB, we set the flag to "to_delete" true.
      if (state.houses[houseIndex].rooms[roomIndex].id) {
        action = {
          [roomIndex]: {
            to_delete: {
              $set: true
            }
          }
        };
      } else {
        // if not, we remove it
        action = {
          $splice: [[roomIndex, 1]]
        };
      }
      const newState = update(state, {
        houses: {
          [houseIndex]: {
            rooms: action
          }
        }
      });
      store.setState(newState);
    },
    addHouse(state) {
      const newState = update(state, {
        houses: {
          $unshift: [
            {
              id: uuid.v4(),
              name: null,
              latitude: null,
              longitude: null,
              rooms: []
            }
          ]
        }
      });
      store.setState(newState);
    },
    async saveHouse(state, houseIndex) {
      store.setState({
        houseUpdateStatus: RequestStatus.Getting
      });
      const house = state.houses[houseIndex];
      try {
        let houseCreatedOrUpdated;

        // if house has property created_at, it means it has been created.
        if (house.created_at) {
          houseCreatedOrUpdated = await state.httpClient.patch(`/api/v1/house/${house.selector}`, house);
        } else {
          houseCreatedOrUpdated = await state.httpClient.post(`/api/v1/house`, house);
        }

        const promises = house.rooms.map(async room => {
          if (room.to_delete) {
            return state.httpClient.delete(`/api/v1/room/${room.selector}`, room);
          }
          if (!room.id) {
            return state.httpClient.post(`/api/v1/house/${houseCreatedOrUpdated.selector}/room`, room);
          }
          return room;
        });

        const rooms = await Promise.all(promises);
        const roomsWithoutDeleted = rooms.filter(room => room.selector !== undefined);

        const newState = update(state, {
          houses: {
            [houseIndex]: {
              id: {
                $set: houseCreatedOrUpdated.id
              },
              selector: {
                $set: houseCreatedOrUpdated.selector
              },
              rooms: {
                $set: roomsWithoutDeleted
              },
              created_at: {
                $set: houseCreatedOrUpdated.created_at
              }
            }
          },
          houseUpdateStatus: {
            $auto: {
              [house.id]: {
                $set: RequestStatus.Success
              }
            }
          }
        });
        store.setState(newState);
      } catch (e) {
        const status = get(e, 'response.status');
        if (status === 409) {
          store.setState({
            houseUpdateStatus: {
              [house.id]: RequestStatus.ConflictError
            }
          });
        } else if (status === 422) {
          store.setState({
            houseUpdateStatus: {
              [house.id]: RequestStatus.ValidationError
            }
          });
        } else {
          store.setState({
            houseUpdateStatus: {
              [house.id]: RequestStatus.Error
            }
          });
        }
      }
    },
    async deleteHouse(state, houseIndex) {
      store.setState({
        houseUpdateStatus: RequestStatus.Getting
      });
      const house = state.houses[houseIndex];
      try {
        if (house.created_at && house.selector) {
          await state.httpClient.delete(`/api/v1/house/${house.selector}`);
        }
        const newState = update(state, {
          houses: {
            $splice: [[houseIndex, 1]]
          },
          houseUpdateStatus: {
            $auto: {
              [house.id]: {
                $set: RequestStatus.Success
              }
            }
          }
        });
        store.setState(newState);
      } catch (e) {
        store.setState({
          houseUpdateStatus: {
            $auto: {
              [house.id]: {
                $set: RequestStatus.Error
              }
            }
          }
        });
      }
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return actions;
}

export default createActions;
