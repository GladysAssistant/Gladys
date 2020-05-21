/**
 * @description Combine some actions files
 * @param  {...any} allActions
 * @returns Stoer ith combined actions files
 */
function combineActions(...allActions) {
  return store =>
    allActions.reduce((combined, actions) => {
      actions = actions(store);
      for (let i in actions) {
        if (actions.hasOwnProperty(i)) {
          if (combined[i]) throw new Error('Have a repeat action name: ' + i);
          let action = actions[i];
          combined[i] = action;
        }
      }
      return combined;
    }, {});
}

export { combineActions };
