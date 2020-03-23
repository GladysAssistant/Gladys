import { Component } from 'preact';

import { Text, Localizer } from 'preact-i18n';
import Select from '../../../../../components/form/Select';
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

  handleOperatorChange = operator => {
    const newCondition = update(this.props.condition, {
      operator: {
        $set: operator.value
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

  constructor(props) {
    super(props);

    this.state = {
      options: [
        {
          value: '=',
          label: <Text id="editScene.triggersCard.newState.equal" />
        },
        {
          value: '>=',
          label: <Text id="editScene.triggersCard.newState.superiorOrEqual" />
        },
        {
          value: '>',
          label: <Text id="editScene.triggersCard.newState.superior" />
        },
        {
          value: '!=',
          label: <Text id="editScene.triggersCard.newState.different" />
        },
        {
          value: '<=',
          label: <Text id="editScene.triggersCard.newState.lessOrEqual" />
        },
        {
          value: '<',
          label: <Text id="editScene.triggersCard.newState.less" />
        }
      ]
    };
  }

  render(props, { options }) {
    const selectedOption = this.getSelectedOption();
    const selectedOperator = this.state.options.find(option => option.value === props.condition.operator);

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
              <Select value={selectedOption} onChange={this.handleChange} options={props.variableOptions} searchable />
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
              <Select value={selectedOperator} onChange={this.handleOperatorChange} options={options} />
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
