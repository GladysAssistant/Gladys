import { Component } from 'preact';
import { connect } from 'unistore/preact';
import update from 'immutability-helper';
import get from 'get-value';

import withIntlAsProp from '../../../../../utils/withIntlAsProp';

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
            label: `${convertPathToText(
              variablePath
                .split('.')
                .slice(0, -1)
                .join('.'),
              this.props.intl.dictionary
            )} ${get(this, `props.intl.dictionary.editScene.actions.${action.type}`)}`,
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

    return (
      <div>
        {props.action.conditions &&
          props.action.conditions.map((condition, index) => (
            <Condition
              condition={condition}
              index={index}
              variableOptions={variableOptions}
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
