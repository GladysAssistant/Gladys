import { Component } from 'preact';

import { Text, Localizer } from 'preact-i18n';
import Select from 'react-select';
import update from 'immutability-helper';

class Condition extends Component {
  handleChange = selectedOption => {
    const newCondition = update(this.props.condition, {
      variable: {
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
    const newValue = Number.isInteger(parseInt(e.target.value, 10)) ? parseInt(e.target.value, 10) : null;
    const newCondition = update(this.props.condition, {
      value: {
        $set: newValue
      }
    });
    this.props.handleConditionChange(this.props.index, newCondition);
  };

  deleteCondition = () => {
    this.props.deleteCondition(this.props.index);
  };

  getSelectedOption = () => {
    let selectedOption = null;

    this.props.variableOptions.forEach(variableOption => {
      const foundOption = variableOption.options.find(option => this.props.condition.variable === option.value);
      if (foundOption) {
        selectedOption = foundOption;
      }
    });

    return selectedOption;
  };

  render(props, {}) {
    const selectedOption = this.getSelectedOption();
    return (
      <div>
        <div class="row">
          <div class="col-md-4">
            <div class="form-group">
              <label class="form-label">
                <Text id="editScene.actionsCard.onlyContinueIf.variableLabel" />
                <span class="form-required">
                  <Text id="global.requiredField" />
                </span>
              </label>
              <Select
                defaultValue={''}
                value={selectedOption}
                onChange={this.handleChange}
                options={props.variableOptions}
              />
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label class="form-label">
                <Text id="editScene.actionsCard.onlyContinueIf.operatorLabel" />
                <span class="form-required">
                  <Text id="global.requiredField" />
                </span>
              </label>
              <select class="form-control" value={props.condition.operator} onChange={this.handleOperatorChange}>
                <option value="">
                  <Text id="global.emptySelectOption" />
                </option>
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
          </div>
          <div class="col-md-4">
            <div class="form-group">
              <label class="form-label">
                <Text id="editScene.actionsCard.onlyContinueIf.valueLabel" />
                <span class="form-required">
                  <Text id="global.requiredField" />
                </span>
              </label>
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
          </div>
          <div class="col-md-2">
            {props.index > 0 && (
              <div class="form-group">
                <label class="form-label">
                  <Text id="editScene.actionsCard.onlyContinueIf.removeLabel" />
                </label>
                <button class="btn btn-danger" onClick={this.deleteCondition}>
                  <i class="fe fe-x" />
                </button>
              </div>
            )}
          </div>
        </div>
        <div class="row">
          <div class="col">
            {props.lastOne && (
              <button onClick={this.props.addCondition} class="btn btn-secondary btn-sm">
                <Text id="editScene.actionsCard.onlyContinueIf.orButton" />
              </button>
            )}
            {!props.lastOne && (
              <p>
                <Text id="editScene.actionsCard.onlyContinueIf.orText" />
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default Condition;
