import { RequestStatus } from '../utils/consts';
import update, { extend } from 'immutability-helper';

extend('$auto', (value, object) => {
  return object ? update(object, value) : update({}, value);
});

import debounce from 'debounce';
import get from 'get-value';
import uuid from 'uuid';

import translations from '../config/i18n';

function sortRoomsInHouses(houses) {
  houses.forEach(house => house.rooms.sort((r1, r2) => r1.name.localeCompare(r2.name)));
}

/**
 * @description Returns the localized name given to a house that was just created,
 * suffixed so that creating several houses in a row doesn't hit the unique
 * name constraint.
 * @param {object} state - Current state.
 * @returns {string} The name of the new house.
 * @example getDefaultHouseName(state);
 */
function getDefaultHouseName(state) {
  const dictionary = translations[state.language] || translations.en;
  const baseName = get(dictionary, 'housesSettings.defaultNewHouseName') || 'New House';
  const existingNames = (state.houses || []).map(house => house.name);
  if (!existingNames.includes(baseName)) {
    return baseName;
  }
  let index = 2;
  while (existingNames.includes(`${baseName} ${index}`)) {
    index += 1;
  }
  return `${baseName} ${index}`;
}

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
        sortRoomsInHouses(houses);
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
    updateHouseAlarmCode(state, code, houseIndex) {
      const newState = update(state, {
        houses: {
          [houseIndex]: {
            alarm_code: {
              $set: code
            }
          }
        }
      });
      store.setState(newState);
    },
    updateHouseDelayBeforeArming(state, delayBeforeArming, houseIndex) {
      const newState = update(state, {
        houses: {
          [houseIndex]: {
            alarm_delay_before_arming: {
              $set: parseInt(delayBeforeArming, 10)
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
      if (state.houses[houseIndex].rooms.find(room => room.name.toLowerCase() === name.toLowerCase())) {
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
      // if the room already exists in DB, we set the flag to "to_delete" true.
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
    editRoom(state, houseIndex, roomIndex, property, value) {
      const newState = update(state, {
        houses: {
          [houseIndex]: {
            rooms: {
              [roomIndex]: {
                [property]: {
                  $set: value
                },
                to_update: {
                  $set: true
                }
              }
            }
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
              // a named house from the start: the list shows houses by name,
              // and an empty one would be an unreadable row (and a house the
              // server refuses to save)
              name: getDefaultHouseName(state),
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
      const house = state.houses[houseIndex];
      // statuses are keyed by house: a save must not wipe the alert another
      // house is currently displaying, and starting a save clears the
      // previous result of that same house
      store.setState({
        houseUpdateStatus: { ...state.houseUpdateStatus, [house.id]: RequestStatus.Getting }
      });
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
            return state.httpClient.delete(`/api/v1/room/${room.selector}`);
          }
          if (!room.id) {
            return state.httpClient.post(`/api/v1/house/${houseCreatedOrUpdated.selector}/room`, room);
          } else if (room.to_update) {
            return state.httpClient.patch(`/api/v1/room/${room.selector}`, { name: room.name });
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
        const url = get(e, 'response.config.url');
        let houseStatus = RequestStatus.Error;
        if (status === 409 && url.endsWith('/room')) {
          houseStatus = RequestStatus.RoomConflictError;
        } else if (status === 409) {
          houseStatus = RequestStatus.ConflictError;
        } else if (status === 422 && url.includes('/room')) {
          houseStatus = RequestStatus.RoomValidationError;
        } else if (status === 422) {
          houseStatus = RequestStatus.ValidationError;
        }
        store.setState({
          houseUpdateStatus: { ...store.getState().houseUpdateStatus, [house.id]: houseStatus }
        });
      }
    },
    async deleteHouse(state, houseIndex) {
      const house = state.houses[houseIndex];
      store.setState({
        houseUpdateStatus: { ...state.houseUpdateStatus, [house.id]: RequestStatus.Getting }
      });
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
          houseUpdateStatus: { ...store.getState().houseUpdateStatus, [house.id]: RequestStatus.Error }
        });
      }
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return actions;
}

export default createActions;
