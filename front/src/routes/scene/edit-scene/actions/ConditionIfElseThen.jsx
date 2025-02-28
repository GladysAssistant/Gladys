import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import get from 'get-value';
import ActionGroup from '../ActionGroup';
import ActionCard from '../ActionCard';

import withIntlAsProp from '../../../../utils/withIntlAsProp';

import { ACTIONS } from '../../../../../../server/utils/constants';

const isNullOrUndefined = variable => variable === null || variable === undefined;

// List of actions that can be used as conditions
const CONDITION_ACTIONS = [
  ACTIONS.CONDITION.CHECK_TIME,
  ACTIONS.CONDITION.ONLY_CONTINUE_IF,
  ACTIONS.EDF_TEMPO.CONDITION,
  ACTIONS.ALARM.CHECK_ALARM_MODE,
  ACTIONS.CALENDAR.IS_EVENT_RUNNING,
  ACTIONS.ECOWATT.CONDITION,
  ACTIONS.HOUSE.IS_EMPTY,
  ACTIONS.HOUSE.IS_NOT_EMPTY
];

class ConditionIfElseThen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      thenCollapsed: false,
      elseCollapsed: true
    };
  }

  toggleThenCollapse = () => {
    this.setState(prevState => ({
      thenCollapsed: !prevState.thenCollapsed
    }));
  };

  toggleElseCollapse = () => {
    this.setState(prevState => ({
      elseCollapsed: !prevState.elseCollapsed
    }));
  };

  initActionIfNeeded = () => {
    if (isNullOrUndefined(get(this.props, 'action.if'))) {
      this.props.updateActionProperty(this.props.path, 'if', []);
    }
    if (isNullOrUndefined(get(this.props, 'action.then'))) {
      this.props.updateActionProperty(this.props.path, 'then', [[]]);
    }
    if (isNullOrUndefined(get(this.props, 'action.else'))) {
      this.props.updateActionProperty(this.props.path, 'else', [[]]);
    }
    // Init variables
    // this.props.setVariables(`${this.props.path}.if`, []);
    // this.props.setVariables(`${this.props.path}.then`, [[]]);
    // this.props.setVariables(`${this.props.path}.else`, [[]]);
  };

  componentDidMount() {
    this.initActionIfNeeded();
  }

  addCondition = () => {
    this.props.addAction(`${this.props.path}.if`, { filter: CONDITION_ACTIONS });
  };

  render(props, { thenCollapsed, elseCollapsed }) {
    const conditions = get(props, 'action.if', []);

    return (
      <>
        {/* Conditions Section */}
        <div class="conditions-container mb-4">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h4>
              <Text id="editScene.actionsCard.conditionIfThenElse.conditions">Conditions</Text>
            </h4>
          </div>
          {conditions.length > 0 && (
            <div class="row">
              <div class="col">
                <div class="alert alert-secondary">
                  <Text id="editScene.actionsCard.conditionIfThenElse.conditionDescription">
                    If all conditions are met, the actions in the "Then" block will be executed.
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
                  <Text id="editScene.actionsCard.conditionIfThenElse.noCondition">
                    No condition has been added yet. Click the '+' button to add a condition to this block
                  </Text>
                </div>
              </div>
            )}
          </div>
          <div class="text-center mt-4">
            <button onClick={this.addCondition} class="btn btn-sm btn-outline-primary">
              <i class="fe fe-plus" />{' '}
              <Text id="editScene.actionsCard.conditionIfThenElse.addCondition">Add condition</Text>
            </button>
          </div>
        </div>

        {/* Then Section */}
        <div class="then-container mb-4">
          <div
            class="d-flex justify-content-between align-items-center mb-2 cursor-pointer"
            onClick={this.toggleThenCollapse}
          >
            <h4>
              <i class={`fe fe-chevron-${thenCollapsed ? 'right' : 'down'} mr-2`} />
              <Text id="editScene.actionsCard.conditionIfThenElse.then">Then...</Text>
            </h4>
          </div>
          {!thenCollapsed && props.action.then && (
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

        {/* Else Section */}
        <div class="else-container">
          <div
            class="d-flex justify-content-between align-items-center mb-2 cursor-pointer"
            onClick={this.toggleElseCollapse}
          >
            <h4>
              <i class={`fe fe-chevron-${elseCollapsed ? 'right' : 'down'} mr-2`} />
              <Text id="editScene.actionsCard.conditionIfThenElse.else">Else...</Text>
            </h4>
          </div>
          {!elseCollapsed && props.action.else && (
            <div class="pl-4">
              {props.action.else.map((actions, index) => (
                <ActionGroup
                  actions={actions}
                  allActions={props.allActions}
                  path={`${props.path}.else.${index}`}
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
                  lastActionGroup={index === props.action.else.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(ConditionIfElseThen));
