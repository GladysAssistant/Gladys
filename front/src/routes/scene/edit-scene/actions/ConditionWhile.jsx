import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import get from 'get-value';
import ActionGroup from '../ActionGroup';
import ActionCard from '../ActionCard';
import style from '../style.css';

import withIntlAsProp from '../../../../utils/withIntlAsProp';

import { ACTIONS, CONDITION_ACTIONS } from '../../../../../../server/utils/constants';

const isNullOrUndefined = variable => variable === null || variable === undefined;

// Conditions of a loop are executed in serie, so "device.get-value" can be used to refresh
// the value of a device feature before comparing it, on each iteration of the loop.
const WHILE_CONDITION_ACTIONS = [ACTIONS.DEVICE.GET_VALUE, ...CONDITION_ACTIONS];

// Must stay in sync with the max_iterations validation of the scene model
const MIN_ITERATIONS = 1;
const MAX_ITERATIONS = 10000;

class ConditionWhile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      repeatCollapsed: false
    };
  }

  toggleRepeatCollapse = () => {
    this.setState(prevState => ({
      repeatCollapsed: !prevState.repeatCollapsed
    }));
  };

  handleRepeatKeyDown = e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.toggleRepeatCollapse();
    }
  };

  getNumberOfActionsInRepeat = () => {
    if (!this.props.action || !this.props.action.then) return 0;
    return this.props.action.then.map(actions => actions.length).reduce((a, b) => a + b, 0);
  };

  initActionIfNeeded = () => {
    if (isNullOrUndefined(get(this.props, 'action.if'))) {
      this.props.updateActionProperty(this.props.path, 'if', []);
    }
    if (isNullOrUndefined(get(this.props, 'action.then'))) {
      this.props.updateActionProperty(this.props.path, 'then', [[]]);
    }
  };

  componentDidMount() {
    this.initActionIfNeeded();
  }

  addCondition = () => {
    this.props.addAction(`${this.props.path}.if`, { filter: WHILE_CONDITION_ACTIONS });
  };

  updateMaxIterations = e => {
    const rawValue = e.target.value;
    // An empty field means "use the default value"
    if (rawValue === '') {
      this.props.updateActionProperty(this.props.path, 'max_iterations', undefined);
      return;
    }
    const value = Number(rawValue);
    // Only persist values the server would accept, so the scene stays saveable
    if (!Number.isInteger(value) || value < MIN_ITERATIONS || value > MAX_ITERATIONS) {
      return;
    }
    this.props.updateActionProperty(this.props.path, 'max_iterations', value);
  };

  render(props, { repeatCollapsed }) {
    // "action.if" can be explicitly null before componentDidMount initializes it
    const conditionsFromAction = get(props, 'action.if', []);
    const conditions = Array.isArray(conditionsFromAction) ? conditionsFromAction : [];
    const maxIterationsInputId = `while-max-iterations-${props.path}`;

    return (
      <>
        {/* Max iterations safety limit. Kept at the top of the block: the "Repeat" section
            below can be long, and this limit should stay visible without scrolling. */}
        <div class="form-group mb-4">
          <label class="form-label" for={maxIterationsInputId}>
            <Text id="editScene.actionsCard.conditionWhile.maxIterationsLabel">
              Maximum number of iterations (safety limit)
            </Text>
          </label>
          <input
            id={maxIterationsInputId}
            type="number"
            class="form-control"
            min={MIN_ITERATIONS}
            max={MAX_ITERATIONS}
            placeholder="1000"
            value={isNullOrUndefined(props.action.max_iterations) ? '' : props.action.max_iterations}
            onChange={this.updateMaxIterations}
          />
          <small class="form-text text-muted">
            <Text id="editScene.actionsCard.conditionWhile.maxIterationsDescription">
              When this limit is reached, only the loop stops: the following actions of the scene are still executed.
            </Text>
          </small>
        </div>

        {/* Conditions Section */}
        <div class="conditions-container mb-4">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h4>
              <Text id="editScene.actionsCard.conditionWhile.conditions">Conditions</Text>
            </h4>
          </div>
          <div class="row">
            <div class="col">
              <div class="alert alert-secondary">
                <Text id="editScene.actionsCard.conditionWhile.conditionDescription">
                  As long as all conditions are met, the actions in the "Repeat" block will be executed in a loop. The
                  conditions are re-evaluated before each iteration.
                </Text>
              </div>
            </div>
          </div>
          <div
            class="row"
            data-condition-flow
            data-flow-path={`${props.path}.if`}
            data-drop-active-class={style.nestedFlowDropActive}
          >
            {conditions.map((condition, index) => (
              <ActionCard
                key={condition}
                action={condition}
                index={index}
                allActions={props.allActions}
                path={`${props.path}.if.${index}`}
                updateActionProperty={props.updateActionProperty}
                deleteAction={props.deleteAction}
                actionsGroupsBefore={props.actionsGroupsBefore}
                variables={props.variables}
                triggersVariables={props.triggersVariables}
                setVariables={props.setVariables}
                moveCard={props.moveCard}
                moveCardGroup={props.moveCardGroup}
                scene={props.scene}
              />
            ))}
            {conditions.length === 0 && (
              <div class="col">
                <div class="alert alert-secondary">
                  <Text id="editScene.actionsCard.conditionWhile.noCondition">
                    No condition has been added yet. Click the '+' button to add a condition to this block. Without
                    condition, the loop will not run.
                  </Text>
                </div>
              </div>
            )}
          </div>
          <div class="text-center mt-4">
            <button onClick={this.addCondition} class="btn btn-sm btn-outline-primary">
              <i class="fe fe-plus" /> <Text id="editScene.actionsCard.conditionWhile.addCondition">Add condition</Text>
            </button>
          </div>
        </div>

        {/* Repeat Section */}
        <div class="repeat-container mb-4">
          <div
            class="d-flex justify-content-between align-items-center mb-2 cursor-pointer"
            onClick={this.toggleRepeatCollapse}
            onKeyDown={this.handleRepeatKeyDown}
            role="button"
            tabIndex="0"
            aria-expanded={!repeatCollapsed}
          >
            <h4>
              <i class={`fe fe-chevron-${repeatCollapsed ? 'right' : 'down'} mr-2`} />
              <Text id="editScene.actionsCard.conditionWhile.repeat">Repeat...</Text>
              {repeatCollapsed && (
                <span class="badge badge-pill badge-secondary ml-2">
                  <Text
                    id="editScene.actionsCard.conditionWhile.actionCount"
                    plural={this.getNumberOfActionsInRepeat()}
                    fields={{
                      count: this.getNumberOfActionsInRepeat()
                    }}
                  />
                </span>
              )}
            </h4>
          </div>
          {!repeatCollapsed && props.action.then && (
            <div
              class="pl-4"
              data-step-flow
              data-flow-path={`${props.path}.then`}
              data-flow-level={props.path.split('.').length + 2}
              data-drop-active-class={style.nestedFlowDropActive}
            >
              {props.action.then.map((actions, index) => (
                <ActionGroup
                  key={actions}
                  actions={actions}
                  allActions={props.allActions}
                  path={`${props.path}.then.${index}`}
                  addAction={props.addAction}
                  deleteAction={props.deleteAction}
                  deleteActionGroup={props.deleteActionGroup}
                  updateActionProperty={props.updateActionProperty}
                  moveCard={props.moveCard}
                  moveCardGroup={props.moveCardGroup}
                  highLightedActions={props.highLightedActions}
                  actionsGroupsBefore={props.actionsGroupsBefore}
                  variables={props.variables}
                  triggersVariables={props.triggersVariables}
                  setVariables={props.setVariables}
                  scene={props.scene}
                  lastActionGroup={index === props.action.then.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(ConditionWhile));
