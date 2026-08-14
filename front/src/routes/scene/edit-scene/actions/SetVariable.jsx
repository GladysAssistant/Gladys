import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import withIntlAsProp from '../../../../utils/withIntlAsProp';
import TextWithVariablesInjected from '../../../../components/scene/TextWithVariablesInjected';
import style from './DeviceSetValue.css';

class SetVariable extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      computed: props.action.evaluate_value !== undefined
    };
  }

  toggleType = () => this.setState({ computed: !this.state.computed });

  handleChangeName = e => {
    const newName = e.target.value;
    this.props.updateActionProperty(this.props.path, 'name', newName.length > 0 ? newName : undefined);
    this.setVariables(newName);
  };

  handleNewText = text => {
    this.props.updateActionProperty(this.props.path, 'evaluate_value', undefined);
    this.props.updateActionProperty(this.props.path, 'text', text.length > 0 ? text : undefined);
  };

  handleNewEvalValue = text => {
    this.props.updateActionProperty(this.props.path, 'text', undefined);
    this.props.updateActionProperty(this.props.path, 'evaluate_value', text.length > 0 ? text : undefined);
  };

  setVariables = name => {
    const DEFAULT_VARIABLE_NAME = get(this.props.intl.dictionary, 'editScene.variables.variable.set.value');
    this.props.setVariables(this.props.path, [
      {
        name: 'value',
        type: 'variable',
        ready: true,
        label: name && name.length > 0 ? name : DEFAULT_VARIABLE_NAME,
        data: {}
      }
    ]);
  };

  componentDidMount() {
    this.setVariables(this.props.action.name);
  }

  getValueInput = () => {
    if (this.state.computed) {
      return (
        <div>
          <div className={style.explanationText}>
            <Text id="editScene.actionsCard.setVariable.computedExplanationText" />
          </div>
          <div className="tags-input">
            <Localizer>
              <TextWithVariablesInjected
                text={this.props.action.evaluate_value}
                triggersVariables={this.props.triggersVariables}
                actionsGroupsBefore={this.props.actionsGroupsBefore}
                variables={this.props.variables}
                path={this.props.path}
                updateText={this.handleNewEvalValue}
                placeholder={<Text id="editScene.actionsCard.setVariable.computedPlaceholder" />}
              />
            </Localizer>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className={style.explanationText}>
          <Text id="editScene.actionsCard.setVariable.textExplanationText" />
        </div>
        <div className="tags-input">
          <Localizer>
            <TextWithVariablesInjected
              text={this.props.action.text}
              triggersVariables={this.props.triggersVariables}
              actionsGroupsBefore={this.props.actionsGroupsBefore}
              variables={this.props.variables}
              path={this.props.path}
              updateText={this.handleNewText}
              placeholder={<Text id="editScene.actionsCard.setVariable.textPlaceholder" />}
            />
          </Localizer>
        </div>
      </div>
    );
  };

  render(props, { computed }) {
    return (
      <div>
        <p>
          <Text id="editScene.actionsCard.setVariable.description" />
        </p>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.setVariable.nameLabel" />
          </label>
          <Localizer>
            <input
              type="text"
              class="form-control"
              value={props.action.name}
              onChange={this.handleChangeName}
              placeholder={<Text id="editScene.actionsCard.setVariable.namePlaceholder" />}
            />
          </Localizer>
        </div>
        <div class="form-group">
          <div className={cx('nav-tabs', style.valueTypeTab)}>
            <span class={cx('nav-link', style.valueTypeLink, { active: !computed })} onClick={this.toggleType}>
              <Text id="editScene.actionsCard.setVariable.valueTypeText" />
            </span>
            <span class={cx('nav-link', style.valueTypeLink, { active: computed })} onClick={this.toggleType}>
              <Text id="editScene.actionsCard.setVariable.valueTypeComputed" />
            </span>
          </div>
        </div>
        <div class="form-group">{this.getValueInput()}</div>
      </div>
    );
  }
}

export default connect('', {})(withIntlAsProp(SetVariable));
