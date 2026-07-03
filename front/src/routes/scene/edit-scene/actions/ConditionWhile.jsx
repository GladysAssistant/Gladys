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
      doCollapsed: false
    };
  }

  toggleDoCollapse = () => {
    this.setState(prevState => ({
      doCollapsed: !prevState.doCollapsed
    }));
  };

  getNumberOfActionsInDo = () => {
    if (!this.props.action || !this.props.action.do) return 0;
    return this.props.action.do.map(actions => actions.length).reduce((a, b) => a + b, 0);
  };

  initActionIfNeeded = () => {
    if (isNullOrUndefined(get(this.props, 'action.while'))) {
      this.props.updateActionProperty(this.props.path, 'while', []);
    }
    if (isNullOrUndefined(get(this.props, 'action.do'))) {
      this.props.updateActionProperty(this.props.path, 'do', [[]]);
    }
  };

  componentDidMount() {
    this.initActionIfNeeded();
  }

  addCondition = () => {
    this.props.addAction(`${this.props.path}.while`, { filter: CONDITION_ACTIONS });
  };

  render(props, { doCollapsed }) {
    const conditions = get(props, 'action.while', []);

    return (
      <>
        <div class="conditions-container mb-4">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h4>
              <Text id="editScene.actionsCard.conditionWhile.conditions">Conditions</Text>
            </h4>
          </div>
          {conditions.length > 0 && (
            <div class="row">
              <div class="col">
                <div class="alert alert-secondary">
                  <Text id="editScene.actionsCard.conditionWhile.conditionDescription">
                    While all conditions are met, the actions in the block below will be executed repeatedly.
                  </Text>
                </div>
              </div>
            </div>
          )}
          <div class="row">
            {conditions.map((condition, index) => (
              <ActionCard
                action={condition}
                index={index}
                allActions={props.allActions}
                path={`${props.path}.while.${index}`}
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
                    No condition has been added yet. Click the '+' button to add a condition to this block
                  </Text>
                </div>
              </div>
            )}
          </div>
          <div class="text-center mt-4">
            <button onClick={this.addCondition} class="btn btn-sm btn-outline-primary">
              <i class="fe fe-plus" />{' '}
              <Text id="editScene.actionsCard.conditionWhile.addCondition">Add condition</Text>
            </button>
          </div>
        </div>

        <div class="do-container mb-4">
          <div
            class="d-flex justify-content-between align-items-center mb-2 cursor-pointer"
            onClick={this.toggleDoCollapse}
          >
            <h4>
              <i class={`fe fe-chevron-${doCollapsed ? 'right' : 'down'} mr-2`} />
              <Text id="editScene.actionsCard.conditionWhile.do">Do...</Text>
              {doCollapsed && (
                <span class="badge badge-pill badge-secondary ml-2">
                  <Text
                    id="editScene.actionsCard.conditionWhile.actionCount"
                    plural={this.getNumberOfActionsInDo()}
                    fields={{
                      count: this.getNumberOfActionsInDo()
                    }}
                  />
                </span>
              )}
            </h4>
          </div>
          {!doCollapsed && props.action.do && (
            <div class="pl-4">
              {props.action.do.map((actions, index) => (
                <ActionGroup
                  actions={actions}
                  allActions={props.allActions}
                  path={`${props.path}.do.${index}`}
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
                  lastActionGroup={index === props.action.do.length - 1}
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
