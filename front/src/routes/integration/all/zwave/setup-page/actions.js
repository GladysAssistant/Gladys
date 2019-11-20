import get from 'get-value';
import update from 'immutability-helper';

import { RequestStatus } from '../../../../../utils/consts';
import { getCategory } from '../../../../../../../server/services/zwave/lib/utils/getCategory';
import { getDeviceFeatureExternalId } from '../../../../../../../server/services/zwave/lib/utils/externalId';
import { ERROR_MESSAGES } from '../../../../../../../server/utils/constants';
import createActionsIntegration from '../../../../../actions/integration';

const addParamsAndFeatures = node => {
  node.features = [];
  node.params = [];
  const comclasses = Object.keys(node.classes);
  comclasses.forEach(comclass => {
    const values = node.classes[comclass];
    const indexes = Object.keys(values);
    indexes.forEach(idx => {
      const { min, max } = values[idx];

      if (values[idx].genre === 'user') {
        const { category, type } = getCategory(node, values[idx]);
        if (category !== 'unknown') {
          node.features.push({
            name: `${values[idx].label} - ${node.product} -  Node ${node.id}`,
            category,
            type,
            external_id: getDeviceFeatureExternalId(values[idx]),
            read_only: values[idx].read_only,
            unit: values[idx].units,
            has_feedback: true,
            min,
            max
          });
        }
      } else {
        node.params.push({
          name: `${values[idx].label}-${values[idx].value_id}`,
          value: values[idx].value || ''
        });
      }
    });
  });
};

const createActions = store => {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    addLocalNode(state, node) {
      addParamsAndFeatures(node);
      const nodeInArrayIndex = state.zwaveNodes.findIndex(n => n.id === node.id);
      let newState;
      if (nodeInArrayIndex !== -1) {
        newState = update(state, {
          zwaveNodes: {
            $push: [node]
          }
        });
      } else {
        newState = update(state, {
          zwaveNodes: {
            [nodeInArrayIndex]: {
              $set: node
            }
          }
        });
      }
      console.log(newState);
      store.setState(newState);
    },
    async getNodes(state) {
      store.setState({
        zwaveGetNodesStatus: RequestStatus.Getting
      });
      try {
        const zwaveNodes = await state.httpClient.get('/api/v1/service/zwave/node');
        const zwaveNodesFiltered = zwaveNodes.filter(node => node.ready === true);
        zwaveNodesFiltered.forEach(node => addParamsAndFeatures(node));
        store.setState({
          zwaveNodes: zwaveNodesFiltered,
          zwaveGetNodesStatus: RequestStatus.Success
        });
      } catch (e) {
        const responseMessage = get(e, 'response.data.message');
        if (responseMessage === ERROR_MESSAGES.SERVICE_NOT_CONFIGURED) {
          store.setState({
            zwaveGetNodesStatus: RequestStatus.ServiceNotConfigured
          });
        } else {
          store.setState({
            zwaveGetNodesStatus: RequestStatus.Error
          });
        }
      }
    },
    async addNode(state, e, secure = false) {
      if (e) {
        e.preventDefault();
      }
      store.setState({
        zwaveAddNodeStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/zwave/node/add', {
          secure
        });
        store.setState({
          zwaveAddNodeStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          zwaveAddNodeStatus: RequestStatus.Error
        });
      }
    },
    async addNodeSecure(state, e) {
      actions.addNode(state, e, true);
    },
    async stopAddNode(state) {
      store.setState({
        zwaveStopAddNodeStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/zwave/cancel');
        store.setState({
          zwaveStopAddNodeStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          zwaveStopAddNodeStatus: RequestStatus.Error
        });
      }
    },
    async healNetwork(state) {
      store.setState({
        zwaveHealNetworkStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/zwave/heal');
        store.setState({
          zwaveHealNetworkStatus: RequestStatus.Success
        });
        actions.getStatus(store.getState());
      } catch (e) {
        store.setState({
          zwaveHealNetworkStatus: RequestStatus.Error
        });
      }
    },
    async getStatus(state) {
      store.setState({
        zwaveGetStatusStatus: RequestStatus.Getting
      });
      try {
        const zwaveStatus = await state.httpClient.get('/api/v1/service/zwave/status');
        store.setState({
          zwaveStatus,
          zwaveGetStatusStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          zwaveGetStatusStatus: RequestStatus.Error
        });
      }
    },
    async createDevice(state, node) {
      const newDevice = {
        name: node.product,
        service_id: state.currentIntegration.id,
        external_id: `zwave:node_id:${node.id}`,
        features: [],
        params: []
      };
      const comclasses = Object.keys(node.classes);
      comclasses.forEach(comclass => {
        const values = node.classes[comclass];
        const indexes = Object.keys(values);
        indexes.forEach(idx => {
          const { min, max } = values[idx];

          if (values[idx].genre === 'user') {
            const { category, type } = getCategory(node, values[idx]);
            if (category !== 'unknown') {
              newDevice.features.push({
                name: `${values[idx].label} - ${node.product} -  Node ${node.id}`,
                category,
                type,
                external_id: getDeviceFeatureExternalId(values[idx]),
                read_only: values[idx].read_only,
                unit: values[idx].units,
                has_feedback: true,
                min,
                max
              });
            }
          } else {
            newDevice.params.push({
              name: `${values[idx].label}-${values[idx].value_id}`,
              value: values[idx].value || ''
            });
          }
        });
      });
      await state.httpClient.post('/api/v1/device', newDevice);
    }
  };
  return Object.assign({}, actions, integrationActions);
};

export default createActions;
