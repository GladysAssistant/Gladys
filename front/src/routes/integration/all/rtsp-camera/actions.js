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

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getRtspCameraDevices(state, take, skip) {
      store.setState({
        getRtspCameraStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getRtspCameraOrderDir || 'asc',
          take,
          skip
        };
        if (state.rtspCameraSearch && state.rtspCameraSearch.length) {
          options.search = state.rtspCameraSearch;
        }
        const rtspCamerasReceived = await state.httpClient.get('/api/v1/service/rtsp-camera/device', options);
        // find camera url
        rtspCamerasReceived.forEach(camera => {
          const cameraUrlParam = camera.params.find(param => param.name === 'CAMERA_URL');
          if (cameraUrlParam) {
            camera.cameraUrl = cameraUrlParam;
          }
        });
        let rtspCameras;
        if (skip === 0) {
          rtspCameras = rtspCamerasReceived;
        } else {
          rtspCameras = update(state.rtspCameras, {
            $push: rtspCamerasReceived
          });
        }
        store.setState({
          rtspCameras,
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
    async createOrUpdateCamera(state, index) {
      const camera = await state.httpClient.post(`/api/v1/device`, state.rtspCameras[index]);
      const rtspCameras = update(state.rtspCameras, {
        [index]: {
          $set: camera
        }
      });
      store.setState({
        rtspCameras
      });
    },
    addCamera(state) {
      const uniqueId = uuid.v4();
      const rtspCameras = update(state.rtspCameras, {
        $push: [
          {
            id: uniqueId,
            name: null,
            should_poll: true,
            poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
            external_id: uniqueId,
            service_id: state.currentIntegration.id,
            cameraUrl: {
              name: 'CAMERA_URL',
              value: null
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
              }
            ],
            params: [
              {
                name: 'CAMERA_URL',
                value: null
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
    async saveCamera(state, index) {
      const camera = state.rtspCameras[index];
      camera.features[0].name = camera.name;
      await state.httpClient.post(`/api/v1/device`, camera);
    },
    async deleteCamera(state, index) {
      const camera = state.rtspCameras[index];
      if (camera.created_at) {
        await state.httpClient.delete(`/api/v1/device/${camera.selector}`);
      }
      const rtspCameras = update(state.rtspCameras, {
        $splice: [[index, 1]]
      });
      store.setState({
        rtspCameras
      });
    },
    async testConnection(state, index) {
      const camera = state.rtspCameras[index];
      const cameraImage = await state.httpClient.post(`/api/v1/service/rtsp-camera/camera/test`, camera);
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
      await actions.getRtspCameraDevices(store.getState(), 20, 0);
    },
    async changeOrderDir(state, e) {
      store.setState({
        getRtspCameraOrderDir: e.target.value
      });
      await actions.getRtspCameraDevices(store.getState(), 20, 0);
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
