import { Component } from 'preact';
import { connect } from 'unistore/preact';
import update from 'immutability-helper';
import get from 'get-value';

import Condition from './Condition';

@connect('httpClient', {})
class OnlyContinueIf extends Component {
  handleConditionChange = (conditionIndex, condition) => {
    const { columnIndex, index } = this.props;
    const newConditions = update(this.props.action.conditions, {
      [conditionIndex]: {
        $set: condition
      }
    });
    this.props.updateActionProperty(columnIndex, index, 'conditions', newConditions);
  };

  deleteCondition = index => {};

  componentDidMount() {
    const { columnIndex, index } = this.props;
    if (!this.props.action.conditions) {
      this.props.updateActionProperty(columnIndex, index, 'conditions', [{}]);
    }
  }

  render(props, { selectedOptions, deviceOptions }) {
    const variableOptions = [];

    props.actionsGroupsBefore.forEach((actionGroup, groupIndex) => {
      actionGroup.forEach((action, index) => {
        if (this.props.variables[groupIndex][index]) {
          variableOptions.push({
            label: `${groupIndex + 1}. ${get(this, `context.intl.dictionary.editScene.actions.${action.type}`)}`,
            options: this.props.variables[groupIndex][index].map(option => ({
              label: option.label,
              value: `${groupIndex}.${index}.${option.name}`,
              type: option.type,
              data: option.data
            }))
          });
        }
      });
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
            />
          ))}
      </div>
    );
  }
}

export default OnlyContinueIf;
