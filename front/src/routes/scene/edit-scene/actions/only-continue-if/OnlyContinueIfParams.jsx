import { Component } from 'preact';
import { connect } from 'unistore/preact';
import update from 'immutability-helper';
import get from 'get-value';

import withIntlAsProp from '../../../../../utils/withIntlAsProp';

import Condition from './Condition';

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

  addCondition = () => {
    const { columnIndex, index } = this.props;
    const newConditions = update(this.props.action.conditions, {
      $push: [{}]
    });
    this.props.updateActionProperty(columnIndex, index, 'conditions', newConditions);
  };

  deleteCondition = conditionIndex => {
    const { columnIndex, index } = this.props;
    const newConditions = update(this.props.action.conditions, {
      $splice: [[conditionIndex, 1]]
    });
    this.props.updateActionProperty(columnIndex, index, 'conditions', newConditions);
  };

  componentDidMount() {
    const { columnIndex, index } = this.props;
    if (!this.props.action.conditions) {
      this.props.updateActionProperty(columnIndex, index, 'conditions', [{}]);
    }
  }

  render(props, {}) {
    const variableOptions = [];

    props.actionsGroupsBefore.forEach((actionGroup, groupIndex) => {
      actionGroup.forEach((action, index) => {
        if (this.props.variables[groupIndex][index]) {
          variableOptions.push({
            label: `${groupIndex + 1}. ${get(this, `props.intl.dictionary.editScene.actions.${action.type}`)}`,
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
              addCondition={this.addCondition}
              deleteCondition={this.deleteCondition}
              lastOne={index + 1 === props.action.conditions.length}
              triggersVariables={props.triggersVariables}
              actionsGroupsBefore={props.actionsGroupsBefore}
              variables={props.variables}
            />
          ))}
      </div>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(OnlyContinueIf));
