import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import uuid from 'uuid';
import debounce from 'debounce';
import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_POLL_FREQUENCIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS
} from '../../../../../../../server/utils/constants';
import createActionsIntegration from '../../../../../actions/integration';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async complete(linky) {
      const linkyUsagePointParam = linky.params.find(param => param.name === 'LINKY_USAGE_POINT');
      if (linkyUsagePointParam) {
        linky.linkyUsagePoint = linkyUsagePointParam;
      }
      return linky;
    },
    async getEnedisLinkyDevices(state) {
      store.setState({
        getEnedisLinkyStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getEnedisLinkyOrderDir || 'asc'
        };
        if (state.enedisLinkySearch && state.enedisLinkySearch.length) {
          options.search = state.enedisLinkySearch;
        }
        const enedisLinkys = await state.httpClient.get('/api/v1/service/enedis-linky/device', options);
        enedisLinkys.forEach(linky => {
          actions.complete(linky);
        });
        store.setState({
          enedisLinkys,
          getEnedisLinkyStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getEnedisLinkyStatus: RequestStatus.Error
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
    async createOrUpdateLinky(state, index) {
      let linky = await state.httpClient.post(`/api/v1/device`, state.enedisLinkys[index]);
      linky = actions.complete(linky);
      const enedisLinkys = update(state.enedisLinkys, {
        [index]: {
          $set: linky
        }
      });
      store.setState({
        enedisLinkys
      });
    },
    async addLinky(state) {
      const uniqueId = uuid.v4();
      await integrationActions.getIntegrationByName(state, 'enedis-linky');
      const enedisLinkys = update(state.enedisLinkys, {
        $push: [
          {
            id: uniqueId,
            name: null,
            should_poll: true,
            poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_30_MINUTES,
            external_id: `linky:${uniqueId}`,
            service_id: store.getState().currentIntegration.id,
            linkyUsagePoint: {
              name: 'LINKY_USAGE_POINT',
              value: null
            },
            features: [
              {
                name: null,
                selector: null,
                external_id: `linky:${uniqueId}:enery`,
                category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
                type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
                unit: DEVICE_FEATURE_UNITS.WATT_HOUR,
                read_only: true,
                keep_history: true,
                has_feedback: false,
                min: 0,
                max: 1000000
              },
              {
                name: null,
                selector: null,
                external_id: `linky:${uniqueId}:power`,
                category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
                type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
                unit: DEVICE_FEATURE_UNITS.WATT,
                read_only: true,
                keep_history: true,
                has_feedback: false,
                min: 0,
                max: 10000
              }
            ],
            params: [
              {
                name: 'LINKY_USAGE_POINT',
                value: null
              }
            ]
          }
        ]
      });
      store.setState({
        enedisLinkys
      });
    },
    updateLinkyField(state, index, field, value) {
      const enedisLinkys = update(state.enedisLinkys, {
        [index]: {
          [field]: {
            $set: value
          }
        }
      });
      store.setState({
        enedisLinkys
      });
    },
    updateLinkyUsagePoint(state, index, value) {
      const trimmedValue = value && value.trim ? value.trim() : value;
      let linkyUsagePointParamIndex = state.enedisLinkys[index].params.findIndex(
        param => param.name === 'LINKY_USAGE_POINT'
      );
      const enedisLinkys = update(state.enedisLinkys, {
        [index]: {
          linkyUsagePoint: {
            value: {
              $set: trimmedValue
            }
          },
          params: {
            [linkyUsagePointParamIndex]: {
              value: {
                $set: trimmedValue
              }
            }
          }
        }
      });
      store.setState({
        enedisLinkys
      });
    },
    async saveLinky(state, index) {
      const linky = state.enedisLinkys[index];
      linky.features[0].name = `${linky.name} Energy`;
      linky.features[1].name = `${linky.name} Power`;
      let newLinky = await state.httpClient.post(`/api/v1/device`, linky);
      newLinky = await actions.complete(newLinky);
      const enedisLinkys = update(state.enedisLinkys, {
        [index]: {
          $set: newLinky
        }
      });
      store.setState({
        enedisLinkys
      });
    },
    async deleteLinky(state, index) {
      const linky = state.enedisLinkys[index];
      if (linky.created_at) {
        await state.httpClient.delete(`/api/v1/device/${linky.selector}`);
      }
      const enedisLinkys = update(state.enedisLinkys, {
        $splice: [[index, 1]]
      });
      store.setState({
        enedisLinkys
      });
    },
    async testConnection(state, index) {
      const linky = state.enedisLinkys[index];
      const linkyJson = await state.httpClient.post(`/api/v1/service/enedis-linky/linky/test`, linky);
      const enedisLinkys = update(state.enedisLinkys, {
        [index]: {
          linkyJson: {
            $set: linkyJson
          }
        }
      });
      store.setState({
        enedisLinkys
      });
    },
    async search(state, e) {
      store.setState({
        enedisLinkySearch: e.target.value
      });
      await actions.getEnedisLinkyDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getEnedisLinkyOrderDir: e.target.value
      });
      await actions.getEnedisLinkyDevices(store.getState());
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
