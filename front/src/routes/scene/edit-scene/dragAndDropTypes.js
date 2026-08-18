import { ACTIONS } from '../../../../../server/utils/constants';

// The drag and drop types of the scene editor: a type is both what an element declares when it
// is dragged and what a drop target accepts, so cards, action groups and insertion points must
// share the same definitions.
export const ACTION_CARD_TYPE = 'ACTION_CARD_TYPE';
export const CONDITION_CARD_TYPE = 'CONDITION_CARD_TYPE';
export const ACTION_CARD_IF_THEN_ELSE_TYPE = 'ACTION_CARD_IF_THEN_ELSE_TYPE';

const ACTION_GROUP_TYPE_LEVEL = 'ACTION_GROUP_TYPE_LEVEL';

// An action group can only be dragged onto a target of the same level (the number of segments of
// its path), so that a step never lands in a container of a different depth.
export const getActionGroupType = groupPath => `${ACTION_GROUP_TYPE_LEVEL}_${groupPath.split('.').length}`;

export const getDragAndDropType = (actionType, path) => {
  if (path.includes('if')) {
    return CONDITION_CARD_TYPE;
  }
  if (actionType === ACTIONS.CONDITION.IF_THEN_ELSE || actionType === ACTIONS.CONDITION.WHILE) {
    return ACTION_CARD_IF_THEN_ELSE_TYPE;
  }
  return ACTION_CARD_TYPE;
};

// A group holding a single action renders as a plain step, and an empty group as an "add a step"
// insertion point: both accept every element of the flow which can be reordered, whatever its
// own type (a plain action, an if/then/else or while block, an "at the same time" group).
export const getStepAcceptedTypes = groupPath => [
  ACTION_CARD_TYPE,
  ACTION_CARD_IF_THEN_ELSE_TYPE,
  getActionGroupType(groupPath)
];

// The path of the group an action belongs to ("1.0" -> "1", "0.0.then.2.1" -> "0.0.then.2")
export const getGroupPath = actionPath =>
  actionPath
    .split('.')
    .slice(0, -1)
    .join('.');
