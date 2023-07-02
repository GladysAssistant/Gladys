import { RequestStatus } from '../../../../utils/consts';
import update from 'immutability-helper';
import uuid from 'uuid';
import debounce from 'debounce';
import createActionsIntegration from '../../../../actions/integration';
import { MANAGED_FEATURES } from './features';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async complete(androidTV) {
      const androidTVIPParam = androidTV.params.find(param => param.name === 'ANDROID_TV_IP');
      if (androidTVIPParam) {
        androidTV.androidTVIP = androidTVIPParam;
      }
      const androidTVPairedParam = androidTV.params.find(param => param.name === 'ANDROID_TV_PAIRED');
      if (androidTVPairedParam) {
        androidTV.androidTVPaired = {
          name: 'ANDROID_TV_PAIRED',
          value: androidTVPairedParam.value === true || androidTVPairedParam.value === '1'
        };
      }
      return androidTV;
    },
    async getAndroidTVDevices(state) {
      store.setState({
        getAndroidTVStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getAndroidTVOrderDir || 'asc'
        };
        if (state.androidTVSearch && state.androidTVSearch.length) {
          options.search = state.androidTVSearch;
        }
        const androidTVs = await state.httpClient.get('/api/v1/service/android-tv/device', options);
        androidTVs.forEach(androidTV => {
          actions.complete(androidTV);
        });
        store.setState({
          androidTVs,
          getAndroidTVStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getAndroidTVStatus: RequestStatus.Error
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
    async addAndroidTV(state, e, intl) {
      const uniqueId = uuid.v4();
      const deviceExternalId = `androidtv:${uniqueId}`;
      await integrationActions.getIntegrationByName(state, 'android-tv');

      const deviceFeatures = [];

      Object.keys(MANAGED_FEATURES).forEach(category => {
        Object.keys(MANAGED_FEATURES[category]).forEach(type => {
          const featureExternalId = `${deviceExternalId}:${type}`;
          const name = intl.dictionary.deviceFeatureCategory[category][type];
          deviceFeatures.push({
            name,
            external_id: featureExternalId,
            selector: featureExternalId,
            category,
            type,
            read_only: MANAGED_FEATURES[category][type].read_only || false,
            keep_history: false,
            has_feedback: true,
            min: MANAGED_FEATURES[category][type].min || 0,
            max: MANAGED_FEATURES[category][type].max || 1,
            ...MANAGED_FEATURES[category][type]
          });
        });
      });

      const androidTVs = update(state.androidTVs, {
        $push: [
          {
            id: uniqueId,
            name: null,
            should_poll: false,
            external_id: deviceExternalId,
            service_id: store.getState().currentIntegration.id,
            androidTVIP: {
              name: 'ANDROID_TV_IP',
              value: null
            },
            androidTVPaired: {
              name: 'ANDROID_TV_PAIRED',
              value: false
            },
            features: deviceFeatures,
            params: [
              {
                name: 'ANDROID_TV_IP',
                value: null
              },
              {
                name: 'ANDROID_TV_PAIRED',
                value: false
              }
            ]
          }
        ]
      });
      store.setState({
        androidTVs
      });
    },
    updateAndroidTVField(state, index, field, value) {
      const androidTVs = update(state.androidTVs, {
        [index]: {
          [field]: {
            $set: value
          }
        }
      });
      store.setState({
        androidTVs
      });
    },
    updateAndroidTVIP(state, index, value) {
      const trimmedValue = value && value.trim ? value.trim() : value;
      let androidTVIPParamIndex = state.androidTVs[index].params.findIndex(param => param.name === 'ANDROID_TV_IP');
      const androidTVs = update(state.androidTVs, {
        [index]: {
          androidTVIP: {
            value: {
              $set: trimmedValue
            }
          },
          params: {
            [androidTVIPParamIndex]: {
              value: {
                $set: trimmedValue
              }
            }
          }
        }
      });
      store.setState({
        androidTVs
      });
    },
    async saveAndroidTV(state, index) {
      const androidTV = state.androidTVs[index];
      let newAndroidTV = await state.httpClient.post(`/api/v1/device`, androidTV);
      if (!androidTV.created_at) {
        await state.httpClient.post(`/api/v1/service/android-tv/reconnect`, { selector: newAndroidTV.selector });
      }
      newAndroidTV = await actions.complete(newAndroidTV);
      const androidTVs = update(state.androidTVs, {
        [index]: {
          $set: newAndroidTV
        }
      });
      store.setState({
        androidTVs
      });
    },
    async deleteAndroidTV(state, index) {
      const androidTV = state.androidTVs[index];
      if (androidTV.created_at) {
        await state.httpClient.delete(`/api/v1/device/${androidTV.selector}`);
      }
      const androidTVs = update(state.androidTVs, {
        $splice: [[index, 1]]
      });
      store.setState({
        androidTVs
      });
    },
    async sendCode(state, index, deviceId, code) {
      const { success } = await state.httpClient.post(`/api/v1/service/android-tv/code`, { device: deviceId, code });
      let androidTVPairedParamIndex = state.androidTVs[index].params.findIndex(
        param => param.name === 'ANDROID_TV_PAIRED'
      );
      const androidTVs = update(state.androidTVs, {
        [index]: {
          params: {
            [androidTVPairedParamIndex]: {
              value: {
                $set: success
              }
            }
          }
        }
      });
      actions.complete(androidTVs[index]);
      store.setState({
        androidTVs
      });
    },
    async reconnect(state, selector) {
      await state.httpClient.post(`/api/v1/service/android-tv/reconnect`, { selector });
    },
    async search(state, e) {
      store.setState({
        androidTVSearch: e.target.value
      });
      await actions.getAndroidTVDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getAndroidTVOrderDir: e.target.value
      });
      await actions.getAndroidTVDevices(store.getState());
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
