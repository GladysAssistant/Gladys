import { RequestStatus } from '../../../../utils/consts';
import update from 'immutability-helper';
import uuid from 'uuid';
import debounce from 'debounce';
import {
  DEVICE_POLL_FREQUENCIES,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES
} from '../../../../../../server/utils/constants';
import createActionsIntegration from '../../../../actions/integration';
import { stripDeviceStatesForSave } from '../../../../utils/device';

// The body posted for a camera, to save it or to test it. On top of the states of its features (the stored
// image, up to 150 kB of base64), the camera carries the image of the last "Test connection" in
// cameraImage: displayed only, no device column, but posted back it alone could push the body past the
// 100 kB JSON bound of the API.
function toCameraPayload(camera) {
  const { cameraImage, ...cameraToPost } = stripDeviceStatesForSave(camera);
  return cameraToPost;
}

function sortRoomsInHouses(houses) {
  houses.forEach(house => house.rooms.sort((r1, r2) => r1.name.localeCompare(r2.name)));
}

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async complete(camera) {
      const cameraUrlParam = camera.params.find(param => param.name === 'CAMERA_URL');
      if (cameraUrlParam) {
        camera.cameraUrl = cameraUrlParam;
      }
      const cameraRotationParam = camera.params.find(param => param.name === 'CAMERA_ROTATION');
      if (cameraRotationParam) {
        camera.cameraRotation = cameraRotationParam;
      } else {
        // Backward compatibility if param not exist, create it.
        const rotationParam = { name: 'CAMERA_ROTATION', value: '0' };
        camera.cameraRotation = rotationParam;
        camera.params.push(rotationParam);
      }
      return camera;
    },
    // `keepUnsaved`: the list is asked again while the page is open (a search, another order). The
    // cameras added and not saved yet only exist in the page: they stay at the end of the new list,
    // or the answer of a search would drop the camera being typed, and its sheet on a phone.
    async getRtspCameraDevices(state, { keepUnsaved = false } = {}) {
      store.setState({
        getRtspCameraStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getRtspCameraOrderDir || 'asc'
        };
        if (state.rtspCameraSearch && state.rtspCameraSearch.length) {
          options.search = state.rtspCameraSearch;
        }
        const rtspCameras = await state.httpClient.get('/api/v1/service/rtsp-camera/device', options);
        // find camera params
        rtspCameras.forEach(camera => {
          actions.complete(camera);
        });
        // (one being saved meanwhile may already be in the answer: it is not listed twice)
        const unsavedCameras = keepUnsaved
          ? (store.getState().rtspCameras || []).filter(
              camera => !camera.created_at && !rtspCameras.some(saved => saved.id === camera.id)
            )
          : [];
        store.setState({
          rtspCameras: [...rtspCameras, ...unsavedCameras],
          getRtspCameraStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          philipsHueGetBridgesStatus: RequestStatus.Error,
          getRtspCameraStatus: e.message
        });
      }
    },
    async getHouses(state) {
      store.setState({
        housesGetStatus: RequestStatus.Getting
      });
      try {
        const params = {
          expand: 'rooms'
        };
        const housesWithRooms = await state.httpClient.get(`/api/v1/house`, params);
        sortRoomsInHouses(housesWithRooms);
        store.setState({
          housesWithRooms,
          housesGetStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          housesGetStatus: RequestStatus.Error
        });
      }
    },
    async addCamera(state) {
      const uniqueId = uuid.v4();
      await integrationActions.getIntegrationByName(state, 'rtsp-camera');
      const rtspCameras = update(state.rtspCameras, {
        $push: [
          {
            id: uniqueId,
            name: null,
            should_poll: true,
            poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
            external_id: uniqueId,
            service_id: store.getState().currentIntegration.id,
            cameraUrl: {
              name: 'CAMERA_URL',
              value: null
            },
            cameraRotation: {
              name: 'CAMERA_ROTATION',
              value: '0'
            },
            features: [
              {
                name: null,
                selector: null,
                external_id: uniqueId,
                category: DEVICE_FEATURE_CATEGORIES.CAMERA,
                type: DEVICE_FEATURE_TYPES.CAMERA.IMAGE,
                read_only: false,
                keep_history: false,
                has_feedback: false,
                min: 0,
                max: 0
              },
              {
                name: null,
                selector: null,
                external_id: `${uniqueId}:enabled`,
                category: DEVICE_FEATURE_CATEGORIES.CAMERA,
                type: DEVICE_FEATURE_TYPES.CAMERA.ENABLED,
                read_only: false,
                keep_history: false,
                has_feedback: false,
                min: 0,
                max: 1,
                last_value: 1
              }
            ],
            params: [
              {
                name: 'CAMERA_URL',
                value: null
              },
              {
                name: 'CAMERA_ROTATION',
                value: '0'
              }
            ]
          }
        ]
      });
      store.setState({
        rtspCameras
      });
    },
    updateCameraField(state, index, field, value) {
      const rtspCameras = update(state.rtspCameras, {
        [index]: {
          [field]: {
            $set: value
          }
        }
      });
      store.setState({
        rtspCameras
      });
    },
    updateCameraUrl(state, index, value) {
      const trimmedValue = value && value.trim ? value.trim() : value;
      let cameraUrlParamIndex = state.rtspCameras[index].params.findIndex(param => param.name === 'CAMERA_URL');
      const rtspCameras = update(state.rtspCameras, {
        [index]: {
          cameraUrl: {
            value: {
              $set: trimmedValue
            }
          },
          params: {
            [cameraUrlParamIndex]: {
              value: {
                $set: trimmedValue
              }
            }
          }
        }
      });
      store.setState({
        rtspCameras
      });
    },
    updateCameraRotation(state, index, value) {
      let cameraRotationParamIndex = state.rtspCameras[index].params.findIndex(
        param => param.name === 'CAMERA_ROTATION'
      );
      const rtspCameras = update(state.rtspCameras, {
        [index]: {
          cameraRotation: {
            value: {
              $set: value
            }
          },
          params: {
            [cameraRotationParamIndex]: {
              value: {
                $set: value
              }
            }
          }
        }
      });
      store.setState({
        rtspCameras
      });
    },
    async saveCamera(state, index) {
      const camera = state.rtspCameras[index];
      // the features are renamed in the body only: the camera held in the store stays as it is until the
      // server answers, a failed save leaves nothing half-written
      const payload = toCameraPayload({
        ...camera,
        features: camera.features.map(feature => ({ ...feature, name: camera.name }))
      });
      let newCamera = await state.httpClient.post(`/api/v1/device`, payload);
      newCamera = await actions.complete(newCamera);
      const rtspCameras = update(state.rtspCameras, {
        [index]: {
          $set: newCamera
        }
      });
      store.setState({
        rtspCameras
      });
    },
    async deleteCamera(state, camera) {
      if (camera.created_at) {
        await state.httpClient.delete(`/api/v1/device/${camera.selector}`);
      }
      // by identity, in the list as it is now: another camera may have been removed while this
      // request was pending, and the index this one had is then the index of a neighbour
      store.setState({
        rtspCameras: store.getState().rtspCameras.filter(c => c.external_id !== camera.external_id)
      });
    },
    async testConnection(state, index) {
      const camera = state.rtspCameras[index];
      const cameraImage = await state.httpClient.post(
        `/api/v1/service/rtsp-camera/camera/test`,
        toCameraPayload(camera)
      );
      const rtspCameras = update(state.rtspCameras, {
        [index]: {
          cameraImage: {
            $set: cameraImage
          }
        }
      });
      store.setState({
        rtspCameras
      });
    },
    async search(state, e) {
      store.setState({
        rtspCameraSearch: e.target.value
      });
      await actions.getRtspCameraDevices(store.getState(), { keepUnsaved: true });
    },
    async changeOrderDir(state, e) {
      store.setState({
        getRtspCameraOrderDir: e.target.value
      });
      await actions.getRtspCameraDevices(store.getState(), { keepUnsaved: true });
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
