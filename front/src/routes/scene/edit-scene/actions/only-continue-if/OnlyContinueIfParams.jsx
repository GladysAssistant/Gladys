import { Component } from 'preact';
import { connect } from 'unistore/preact';
import update from 'immutability-helper';
import get from 'get-value';

import withIntlAsProp from '../../../../../utils/withIntlAsProp';
import { getDeviceFeatureName } from '../../../../../utils/device';

import { isVariableAvailableAtThisPath, convertPathToText } from '../../sceneUtils';

import Condition from './Condition';

class OnlyContinueIf extends Component {
  handleConditionChange = (conditionIndex, condition) => {
    const newConditions = update(this.props.action.conditions, {
      [conditionIndex]: {
        $set: condition
      }
    });
    this.props.updateActionProperty(this.props.path, 'conditions', newConditions);
  };

  addCondition = () => {
    const newConditions = update(this.props.action.conditions, {
      $push: [{}]
    });
    this.props.updateActionProperty(this.props.path, 'conditions', newConditions);
  };

  deleteCondition = conditionIndex => {
    const newConditions = update(this.props.action.conditions, {
      $splice: [[conditionIndex, 1]]
    });
    this.props.updateActionProperty(this.props.path, 'conditions', newConditions);
  };

  getDeviceFeatureOptions = async () => {
    try {
      const rooms = await this.props.httpClient.get('/api/v1/room', { expand: 'devices' });
      const deviceFeatureOptions = [];

      const sortByLabel = (a, b) => {
        if (a.label < b.label) {
          return -1;
        }
        if (a.label > b.label) {
          return 1;
        }
        return 0;
      };

      const pushDeviceFeatures = (devices, targetFeatures) => {
        devices.forEach(device => {
          device.features.forEach(feature => {
            targetFeatures.push({
              value: feature.selector,
              label: getDeviceFeatureName(this.props.intl.dictionary, device, feature),
              isDeviceFeature: true
            });
          });
        });
      };

      rooms.forEach(room => {
        const roomDeviceFeatures = [];
        pushDeviceFeatures(room.devices, roomDeviceFeatures);
        if (roomDeviceFeatures.length > 0) {
          roomDeviceFeatures.sort(sortByLabel);
          deviceFeatureOptions.push({
            label: room.name,
            options: roomDeviceFeatures
          });
        }
      });

      let devicesWithoutRoom = [];
      try {
        const allDevices = await this.props.httpClient.get('/api/v1/device');
        devicesWithoutRoom = allDevices.filter(device => !device.room_id);
      } catch (e) {
        console.error('Could not load devices without room', e);
      }

      const noRoomDeviceFeatures = [];
      pushDeviceFeatures(devicesWithoutRoom, noRoomDeviceFeatures);
      if (noRoomDeviceFeatures.length > 0) {
        noRoomDeviceFeatures.sort(sortByLabel);
        deviceFeatureOptions.push({
          label: get(this.props.intl.dictionary, 'device.noRoom'),
          options: noRoomDeviceFeatures
        });
      }

      this.setState({ deviceFeatureOptions });
    } catch (e) {
      console.error(e);
    }
  };

  constructor(props) {
    super(props);
    this.state = {
      deviceFeatureOptions: []
    };
  }

  componentDidMount() {
    if (!this.props.action.conditions) {
      this.props.updateActionProperty(this.props.path, 'conditions', [{}]);
    }
    this.getDeviceFeatureOptions();
  }

  render(props, { deviceFeatureOptions }) {
    const variableOptions = [];

    Object.keys(props.variables).forEach(variablePath => {
      // If the variable is defined before the current path, we can use it
      if (isVariableAvailableAtThisPath(variablePath, props.path)) {
        const action = get(props.allActions, variablePath);
        // If we find an action at this path
        if (action) {
          variableOptions.push({
            label: `${convertPathToText(variablePath, this.props.intl.dictionary)} ${get(
              this,
              `props.intl.dictionary.editScene.actions.${action.type}`
            )}`,
            options: props.variables[variablePath].map(option => ({
              label: option.label,
              value: `${variablePath}.${option.name}`,
              type: option.type,
              data: option.data
            }))
          });
        }
      }
    });

    // Device features are proposed by default: their instantaneous value is
    // resolved at scene execution, no "get device value" block needed before
    const allOptions = [...variableOptions, ...deviceFeatureOptions];

    return (
      <div>
        {props.action.conditions &&
          props.action.conditions.map((condition, index) => (
            <Condition
              condition={condition}
              index={index}
              variableOptions={allOptions}
              handleConditionChange={this.handleConditionChange}
              addCondition={this.addCondition}
              deleteCondition={this.deleteCondition}
              lastOne={index + 1 === props.action.conditions.length}
              triggersVariables={props.triggersVariables}
              actionsGroupsBefore={props.actionsGroupsBefore}
              variables={props.variables}
              path={props.path}
              canDeleteCondition={props.action.conditions.length > 1}
            />
          ))}
      </div>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(OnlyContinueIf));
