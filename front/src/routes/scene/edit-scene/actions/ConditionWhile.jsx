import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import get from 'get-value';
import ActionGroup from '../ActionGroup';
import ActionCard from '../ActionCard';

import withIntlAsProp from '../../../../utils/withIntlAsProp';

import { CONDITION_ACTIONS } from '../../../../../../server/utils/constants';

const isNullOrUndefined = variable => variable === null || variable === undefined;

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
    this.props.addAction(`${this.props.path}.if`, { filter: CONDITION_ACTIONS });
  };

  updateMaxIterations = e => {
    const value = parseInt(e.target.value, 10);
    this.props.updateActionProperty(this.props.path, 'max_iterations', Number.isNaN(value) ? undefined : value);
  };

  render(props, { repeatCollapsed }) {
    const conditions = get(props, 'action.if', []);

    return (
      <>
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
          <div class="row">
            {conditions.map((condition, index) => (
              <ActionCard
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
            <div class="pl-4">
              {props.action.then.map((actions, index) => (
                <ActionGroup
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
                  firstActionGroup={index === 0}
                  lastActionGroup={index === props.action.then.length - 1}
                />
              ))}
            </div>
          )}
        </div>

        {/* Max iterations safety limit */}
        <div class="form-group mb-0">
          <label class="form-label">
            <Text id="editScene.actionsCard.conditionWhile.maxIterationsLabel">
              Maximum number of iterations (safety limit)
            </Text>
          </label>
          <input
            type="number"
            class="form-control"
            min="1"
            max="10000"
            placeholder="1000"
            value={isNullOrUndefined(props.action.max_iterations) ? '' : props.action.max_iterations}
            onChange={this.updateMaxIterations}
          />
        </div>
      </>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(ConditionWhile));
