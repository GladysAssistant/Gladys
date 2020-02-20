import { Component } from 'preact';

import { Text, Localizer } from 'preact-i18n';
import Select from 'react-select';
import update from 'immutability-helper';

import { ACTIONS } from '../../../../../../../server/utils/constants';

const ACTIONS_VARIABLES = {
  [ACTIONS.DEVICE.GET_VALUE]: ['last_value']
};

class Condition extends Component {
  handleChange = selectedOption => {
    const newCondition = update(this.props.condition, {
      value: {
        $set: selectedOption && selectedOption.value ? selectedOption.value : null
      }
    });
    this.props.handleConditionChange(this.props.index, newCondition);
  };

  handleOperatorChange = e => {
    const newCondition = update(this.props.condition, {
      operator: {
        $set: e.target.value
      }
    });
    this.props.handleConditionChange(this.props.index, newCondition);
  };

  handleValueChange = e => {
    const newCondition = update(this.props.condition, {
      operator: {
        $set: e.target.value
      }
    });
    this.props.handleConditionChange(this.props.index, newCondition);
  };

  render(props, {}) {
    let selectedOption = props.variableOptions.find(option => props.condition.variable === option);
    return (
      <div>
        <div class="form-group">
          <label class="form-label">
            Variable
            <span class="form-required">*</span>
          </label>
          <Select
            defaultValue={''}
            value={selectedOption}
            onChange={this.handleChange}
            options={props.variableOptions}
          />
        </div>
        <div class="form-group">
          <select class="form-control" value={props.condition.operator} onChange={this.handleOperatorChange}>
            <option value="">-----</option>
            <option value="=">
              <Text id="editScene.triggersCard.newState.equal" />
            </option>
            <option value=">=">
              <Text id="editScene.triggersCard.newState.superiorOrEqual" />
            </option>
            <option value=">">
              <Text id="editScene.triggersCard.newState.superior" />
            </option>
            <option value="!=">
              <Text id="editScene.triggersCard.newState.different" />
            </option>
            <option value="<=">
              <Text id="editScene.triggersCard.newState.lessOrEqual" />
            </option>
            <option value="<">
              <Text id="editScene.triggersCard.newState.less" />
            </option>
          </select>
        </div>
        <div class="form-group">
          <Localizer>
            <input
              type="text"
              class="form-control"
              placeholder={<Text id="editScene.triggersCard.newState.valuePlaceholder" />}
              value={props.condition.value}
              onChange={this.handleValueChange}
            />
          </Localizer>
        </div>
        <div class="form-group">
          <button class="btn btn-secondary btn-sm">+ OR</button>
        </div>
      </div>
    );
  }
}

export default Condition;
