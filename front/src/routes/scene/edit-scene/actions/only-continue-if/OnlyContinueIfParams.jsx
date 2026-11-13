import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import update from 'immutability-helper';
import get from 'get-value';

import withIntlAsProp from '../../../../../utils/withIntlAsProp';
import FormulaFunctionsHelp from '../../../../../components/scene/FormulaFunctionsHelp';
import { getDeviceFeatureName } from '../../../../../utils/device';
import { normalizeSearchString } from '../../../../../utils/searchOptions';

import { isVariableAvailableAtThisPath, convertPathToText } from '../../sceneUtils';

import Condition from './Condition';

const sortByLabel = (a, b) => a.label.localeCompare(b.label);

// The features of the house as options of the condition select, grouped by room (the devices
// without a room last). They come from the devices the editor loaded when it opened
// (deviceFeatures: selector -> { device, feature }), so a condition box costs no request.
const buildDeviceFeatureOptions = (deviceFeatures, dictionary) => {
  const noRoomLabel = get(dictionary, 'device.noRoom');
  const rooms = new Map();
  const noRoomOptions = [];
  Object.keys(deviceFeatures || {}).forEach(selector => {
    const { device, feature } = deviceFeatures[selector];
    const label = getDeviceFeatureName(dictionary, device, feature);
    const roomName = device.room ? device.room.name : noRoomLabel;
    const option = {
      value: selector,
      label,
      // the room is only the header of the group: searchable through this field
      searchText: normalizeSearchString(`${roomName} ${label}`),
      isDeviceFeature: true,
      // same shape as the variable of a "get device value" step: the condition offers the
      // list of values of the feature when it has one
      data: { device, deviceFeature: feature }
    };
    if (!device.room) {
      noRoomOptions.push(option);
      return;
    }
    if (!rooms.has(device.room.id)) {
      rooms.set(device.room.id, { label: roomName, options: [] });
    }
    rooms.get(device.room.id).options.push(option);
  });
  const groups = Array.from(rooms.values()).sort(sortByLabel);
  if (noRoomOptions.length > 0) {
    groups.push({ label: noRoomLabel, options: noRoomOptions });
  }
  groups.forEach(group => group.options.sort(sortByLabel));
  return groups;
};

class OnlyContinueIf extends Component {
  // Rebuilt only when the devices of the editor change, not on every keystroke in the box
  getDeviceFeatureOptions = () => {
    const { deviceFeatures, intl } = this.props;
    if (this.deviceFeatureOptionsSource !== deviceFeatures) {
      this.deviceFeatureOptionsSource = deviceFeatures;
      this.deviceFeatureOptions = buildDeviceFeatureOptions(deviceFeatures, intl.dictionary);
    }
    return this.deviceFeatureOptions;
  };

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

  componentDidMount() {
    if (!this.props.action.conditions) {
      this.props.updateActionProperty(this.props.path, 'conditions', [{}]);
    }
  }

  render(props, {}) {
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

    // After the variables of the previous steps, every device of the house: its state is read
    // when the condition runs, no "get device value" step needed before
    const allOptions = variableOptions.concat(this.getDeviceFeatureOptions());

    return (
      <div>
        <div class="alert alert-secondary">
          <div>
            <Text id="editScene.actionsCard.onlyContinueIf.logicExplanationText" />
          </div>
          <div class="mt-2">
            <Text id="editScene.actionsCard.onlyContinueIf.explanationText" />
          </div>
          <div class="mt-2">
            <FormulaFunctionsHelp />
          </div>
        </div>
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
