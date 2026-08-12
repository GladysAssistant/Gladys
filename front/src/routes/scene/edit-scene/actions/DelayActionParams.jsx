import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import TextWithVariablesInjected from '../../../../components/scene/TextWithVariablesInjected';
import style from './DeviceSetValue.css';

class WaitActionParams extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      computed: props.action.evaluate_value !== undefined
    };
  }

  toggleType = () => this.setState({ computed: !this.state.computed });

  handleChangeDuration = e => {
    let newValue = Number.isInteger(parseInt(e.target.value, 10)) ? parseInt(e.target.value, 10) : 0;
    this.props.updateActionProperty(this.props.path, 'value', newValue);
    this.props.updateActionProperty(this.props.path, 'evaluate_value', undefined);
  };

  handleChangeUnit = e => {
    this.props.updateActionProperty(this.props.path, 'unit', e.target.value);
  };

  handleNewEvalValue = text => {
    this.props.updateActionProperty(this.props.path, 'value', undefined);
    this.props.updateActionProperty(this.props.path, 'evaluate_value', text);
  };

  componentDidMount() {
    if (!this.props.action.unit) {
      this.props.updateActionProperty(this.props.path, 'unit', 'seconds');
    }
  }
  getDurationInput = () => {
    if (this.state.computed) {
      return (
        <div>
          <div className={style.explanationText}>
            <Text id="editScene.actionsCard.delay.computedExplanationText" />
          </div>
          <div class="input-group">
            <Localizer>
              <TextWithVariablesInjected
                text={
                  this.props.action.value !== undefined
                    ? Number(this.props.action.value).toString()
                    : this.props.action.evaluate_value
                }
                triggersVariables={this.props.triggersVariables}
                actionsGroupsBefore={this.props.actionsGroupsBefore}
                variables={this.props.variables}
                path={this.props.path}
                updateText={this.handleNewEvalValue}
                placeholder={<Text id="editScene.actionsCard.delay.inputPlaceholder" />}
              />
            </Localizer>
          </div>
        </div>
      );
    }

    return (
      <div>
        <Localizer>
          <input
            type="text"
            class="form-control"
            value={this.props.action.value}
            onChange={this.handleChangeDuration}
            placeholder={<Text id="editScene.actionsCard.delay.inputPlaceholder" />}
          />
        </Localizer>
      </div>
    );
  };

  render(props, {}) {
    return (
      <div>
        <p>
          <Text id="editScene.actionsCard.delay.label" />
        </p>
        <div class="form-group">
          <div className={cx('nav-tabs', style.valueTypeTab)}>
            <span
              class={cx('nav-link', style.valueTypeLink, { active: !this.state.computed })}
              onClick={this.toggleType}
            >
              <Text id="editScene.actionsCard.delay.valueTypeSimple" />
            </span>
            <span
              class={cx('nav-link', style.valueTypeLink, { active: this.state.computed })}
              onClick={this.toggleType}
            >
              <Text id="editScene.actionsCard.delay.valueTypeComputed" />
            </span>
          </div>
        </div>
        <div class="form-group">{this.getDurationInput()}</div>
        <div class="form-group">
          <select class="custom-select" value={props.action.unit} onChange={this.handleChangeUnit}>
            <option value="milliseconds">
              <Text id="editScene.actionsCard.delay.milliseconds" />
            </option>
            <option value="seconds">
              <Text id="editScene.actionsCard.delay.seconds" />
            </option>
            <option value="minutes">
              <Text id="editScene.actionsCard.delay.minutes" />
            </option>
            <option value="hours">
              <Text id="editScene.actionsCard.delay.hours" />
            </option>
          </select>
        </div>
      </div>
    );
  }
}

export default connect('', {})(WaitActionParams);
