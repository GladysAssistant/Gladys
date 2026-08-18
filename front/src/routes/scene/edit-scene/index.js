import { Component } from 'preact';
import { connect } from 'unistore/preact';
import update from 'immutability-helper';
import { route } from 'preact-router';
import { DndProvider } from 'react-dnd';
import get from 'get-value'; // Import get-value package

import { RequestStatus } from '../../../utils/consts';
import { getDragAndDropBackend } from '../../../utils/dragAndDropBackend';
import EditScenePage from './EditScenePage';
import { computeRunningInfo, mergeRunningScenes } from '../runningInfo';

import { ACTIONS, WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';

const VARIABLES_ATTRIBUTES_IN_ACTION = {
  [ACTIONS.MESSAGE.SEND]: ['text'],
  [ACTIONS.AI.ASK]: ['text'],
  [ACTIONS.MESSAGE.SEND_CAMERA]: ['text'],
  [ACTIONS.SMS.SEND]: ['text'],
  [ACTIONS.MUSIC.PLAY_NOTIFICATION]: ['text'],
  [ACTIONS.MQTT.SEND]: ['message'],
  [ACTIONS.ZIGBEE2MQTT.SEND]: ['message'],
  [ACTIONS.DEVICE.SET_VALUE]: ['evaluate_value'],
  [ACTIONS.TIME.DELAY]: ['evaluate_value'],
  [ACTIONS.VARIABLE.SET]: ['text', 'evaluate_value'],
  [ACTIONS.HTTP.REQUEST]: ['body'],
  [ACTIONS.CONDITION.ONLY_CONTINUE_IF]: ['conditions[].evaluate_value', 'conditions[].variable']
};

// Replaces, in a text containing variables (e.g. "The temperature is {{1.0.last_value}}°C"),
// all the references to a variable path by its new path.
const replaceVariablePathInText = (text, prevPath, newPath) => text.split(`{{${prevPath}.`).join(`{{${newPath}.`);

// Replaces the path of a variable selector (e.g. "1.0.last_value"), which is stored
// without the surrounding curly braces.
const replaceVariablePathInSelector = (selector, prevPath, newPath) =>
  selector.startsWith(`${prevPath}.`) ? `${newPath}${selector.slice(prevPath.length)}` : selector;

// Rewrites, in all the actions (including the ones nested in if/then/else branches), the
// references to the scene variables whose path changed, so that a scene stays coherent when
// an action group is inserted or deleted.
// Replacements are applied in the order they are given: they must be sorted from the smallest
// index to the biggest one when indexes are decremented (an action group was deleted), and the
// other way around when they are incremented (an action group was inserted), so that a path is
// never rewritten twice.
const replaceVariablePathsInActions = (actions, replacements) => {
  if (!Array.isArray(actions) || replacements.length === 0) {
    return;
  }

  actions.forEach(actionGroup => {
    if (!Array.isArray(actionGroup)) {
      return;
    }

    actionGroup.forEach(action => {
      if (!action) {
        return;
      }

      const attributes = VARIABLES_ATTRIBUTES_IN_ACTION[action.type];
      if (attributes) {
        attributes.forEach(attribute => {
          // In case there are 2 parts in the attribute (e.g., conditions[].variable)
          if (attribute.includes('.')) {
            const [arrayAttribute, subAttribute] = attribute.split('.');
            // If the first part is an array (e.g., conditions[])
            if (arrayAttribute.endsWith('[]')) {
              const array = action[arrayAttribute.slice(0, -2)];
              if (Array.isArray(array)) {
                array.forEach(subAction => {
                  if (typeof subAction[subAttribute] !== 'string') {
                    return;
                  }
                  replacements.forEach(({ prevPath, newPath }) => {
                    // A condition holds either a variable selector ("1.0.last_value"), or a
                    // value to evaluate which contains variables ("{{1.0.last_value}} + 1")
                    subAction[subAttribute] = replaceVariablePathInSelector(
                      replaceVariablePathInText(subAction[subAttribute], prevPath, newPath),
                      prevPath,
                      newPath
                    );
                  });
                });
              }
            }
          } else if (typeof action[attribute] === 'string') {
            replacements.forEach(({ prevPath, newPath }) => {
              action[attribute] = replaceVariablePathInText(action[attribute], prevPath, newPath);
            });
          }
        });
      }

      // Check for nested actions in if/then/else blocks
      if (action.type === ACTIONS.CONDITION.IF_THEN_ELSE || action.type === ACTIONS.CONDITION.WHILE) {
        if (Array.isArray(action.if)) {
          replaceVariablePathsInActions([action.if], replacements);
        }
        if (Array.isArray(action.then)) {
          replaceVariablePathsInActions(action.then, replacements);
        }
        if (Array.isArray(action.else)) {
          replaceVariablePathsInActions(action.else, replacements);
        }
      }
    });
  });
};

// Builds the exact old path -> new path map of the action groups whose path changes when the
// group at `sourcePath` is moved to `destPath`. A group path ("1", "0.0.then.2") is the prefix of
// the paths of the variables its actions declare ("1.0"), so it must always be matched on segment
// boundaries: the group "1" is not the prefix of the variable "10.0".
// A group can only be dragged onto a target of the same level, so the source and the destination
// containers are either the same one, or two containers of the same depth which cannot be nested
// into one another.
const buildMovedGroupPaths = ({ sourcePath, sourceLength, destPath, destLength }) => {
  const sourceSegments = sourcePath.split('.');
  const destSegments = destPath.split('.');
  const sourceContainer = sourceSegments.slice(0, -1).join('.');
  const destContainer = destSegments.slice(0, -1).join('.');
  const sourceIndex = parseInt(sourceSegments[sourceSegments.length - 1], 10);
  const destIndex = parseInt(destSegments[destSegments.length - 1], 10);
  const buildPath = (container, index) => (container ? `${container}.${index}` : `${index}`);
  const replacements = [];

  if (sourceContainer === destContainer) {
    // The group is reordered among its siblings: it is spliced out of the container, then spliced
    // back in at the destination index, which shifts every group in between
    const indexes = [];
    for (let index = 0; index < sourceLength; index += 1) {
      indexes.push(index);
    }
    indexes.splice(sourceIndex, 1);
    indexes.splice(destIndex, 0, sourceIndex);
    indexes.forEach((previousIndex, newIndex) => {
      if (previousIndex !== newIndex) {
        replacements.push({
          prevPath: buildPath(sourceContainer, previousIndex),
          newPath: buildPath(sourceContainer, newIndex)
        });
      }
    });
    return replacements;
  }

  // The group is moved to another container: it takes the destination path, the groups which
  // followed it in its previous container are shifted down, and the ones which are at or after
  // the destination index are shifted up
  replacements.push({ prevPath: sourcePath, newPath: destPath });
  for (let index = sourceIndex + 1; index < sourceLength; index += 1) {
    replacements.push({ prevPath: buildPath(sourceContainer, index), newPath: buildPath(sourceContainer, index - 1) });
  }
  for (let index = destIndex; index < destLength; index += 1) {
    replacements.push({ prevPath: buildPath(destContainer, index), newPath: buildPath(destContainer, index + 1) });
  }
  return replacements;
};

// Renames the variables declared by the action groups whose path changed. The new paths are
// written in a fresh map: renaming in place would drop a variable whose new path is the previous
// path of another one (e.g. "1.0" renamed to "2.0", then "2.0" renamed to "3.0" and deleted).
const renameVariablesOfMovedGroups = (variables, replacements) => {
  const newVariables = {};
  Object.entries(variables).forEach(([variablePath, value]) => {
    const replacement = replacements.find(
      ({ prevPath }) => variablePath === prevPath || variablePath.startsWith(`${prevPath}.`)
    );
    const newPath = replacement
      ? `${replacement.newPath}${variablePath.slice(replacement.prevPath.length)}`
      : variablePath;
    newVariables[newPath] = value;
  });
  return newVariables;
};

// Rewrites, in the whole scene, the references to the variables declared by the action groups
// whose path changed. Moving a group permutes the paths of its siblings, so the replacements
// cannot be applied in a single pass: rewriting "1" to "0" and then "0" to "1" would rewrite the
// same reference twice. Every path is first rewritten to a unique temporary marker, then to its
// final value.
const replaceMovedGroupPathsInActions = (actions, replacements) => {
  if (replacements.length === 0) {
    return;
  }
  const temporaryPaths = replacements.map((replacement, index) => `moved-group-${index}`);
  replaceVariablePathsInActions(
    actions,
    replacements.map(({ prevPath }, index) => ({ prevPath, newPath: temporaryPaths[index] }))
  );
  replaceVariablePathsInActions(
    actions,
    replacements.map(({ newPath }, index) => ({ prevPath: temporaryPaths[index], newPath }))
  );
};

// Removes the empty action groups that older versions of the editor could leave
// in a saved scene (they render as stray "add a step" buttons), and rewrites the
// variable references of the following groups since their indexes shift down.
// Every container (root level and if/then/else branches) is left ending with a
// single empty group: the "add a step" insertion point.
const removeLegacyEmptyActionGroups = (allActions, container, containerPath = '') => {
  const buildPath = index => (containerPath ? `${containerPath}.${index}` : `${index}`);

  const keptGroups = [];
  const replacements = [];
  let removedCount = 0;
  container.forEach((group, originalIndex) => {
    if (Array.isArray(group) && group.length === 0) {
      removedCount += 1;
      return;
    }
    if (removedCount > 0) {
      replacements.push({
        prevPath: buildPath(originalIndex),
        newPath: buildPath(originalIndex - removedCount),
        groupIndex: originalIndex
      });
    }
    keptGroups.push(group);
  });
  container.splice(0, container.length, ...keptGroups);

  // Indexes are decremented: apply from the smallest one first so that a path
  // is never rewritten twice
  replacements.sort((a, b) => a.groupIndex - b.groupIndex);
  replaceVariablePathsInActions(allActions, replacements);

  // Recurse into the branches of if/then/else and while blocks, with their new paths
  container.forEach((group, groupIndex) => {
    group.forEach((action, actionIndex) => {
      if (action && (action.type === ACTIONS.CONDITION.IF_THEN_ELSE || action.type === ACTIONS.CONDITION.WHILE)) {
        const actionPath = `${buildPath(groupIndex)}.${actionIndex}`;
        if (Array.isArray(action.then)) {
          removeLegacyEmptyActionGroups(allActions, action.then, `${actionPath}.then`);
        }
        if (Array.isArray(action.else)) {
          removeLegacyEmptyActionGroups(allActions, action.else, `${actionPath}.else`);
        }
      }
    });
  });

  // Keep a single trailing empty group as the insertion point
  if (container.length === 0 || container[container.length - 1].length > 0) {
    container.push([]);
  }
};

// Helper function to merge update objects
const deepMergeUpdates = (target, source) => {
  if (!source) return target;
  if (!target) return source;

  const result = { ...target };

  Object.keys(source).forEach(key => {
    if (source[key] && typeof source[key] === 'object') {
      if (result[key] && typeof result[key] === 'object') {
        result[key] = deepMergeUpdates(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    } else {
      result[key] = source[key];
    }
  });

  return result;
};

// Helper to initialize variables for a scene
const initializeSceneVariables = (actions, parentPath = '') => {
  let variables = {};

  actions.forEach((actionGroup, groupIndex) => {
    actionGroup.forEach((action, actionIndex) => {
      const currentPath = parentPath ? `${parentPath}.${groupIndex}.${actionIndex}` : `${groupIndex}.${actionIndex}`;

      // Initialize empty array for each action path
      variables[currentPath] = [];

      // Handle nested conditions
      if (action && (action.type === ACTIONS.CONDITION.IF_THEN_ELSE || action.type === ACTIONS.CONDITION.WHILE)) {
        // "if" is a flat list of conditions, each one can declare a variable (device.get-value)
        if (Array.isArray(action.if)) {
          action.if.forEach((condition, conditionIndex) => {
            variables[`${currentPath}.if.${conditionIndex}`] = [];
          });
        }
        if (Array.isArray(action.then)) {
          const thenVariables = initializeSceneVariables(action.then, `${currentPath}.then`);
          variables = { ...variables, ...thenVariables };
        }
        if (Array.isArray(action.else)) {
          const elseVariables = initializeSceneVariables(action.else, `${currentPath}.else`);
          variables = { ...variables, ...elseVariables };
        }
      }
    });
  });

  return variables;
};

class EditScene extends Component {
  getSceneBySelector = async () => {
    this.setState({
      SceneGetStatus: RequestStatus.Getting
    });
    try {
      const scene = await this.props.httpClient.get(`/api/v1/scene/${this.props.scene_selector}`);
      removeLegacyEmptyActionGroups(scene.actions, scene.actions);
      if (!scene.triggers) {
        scene.triggers = [];
      }
      const variables = initializeSceneVariables(scene.actions);
      const triggersVariables = [];
      scene.triggers.forEach(() => {
        triggersVariables.push([]);
      });
      this.setState({
        scene,
        savedSceneSnapshot: JSON.stringify(scene),
        variables,
        triggersVariables,
        SceneGetStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        SceneGetStatus: RequestStatus.Error
      });
    }
  };
  startScene = async () => {
    // Prevent launching a new instance while the scene is already running
    if (computeRunningInfo(this.state.runningScenes, this.props.scene_selector, this.state.now)) {
      return;
    }
    this.setState({ saving: true });
    try {
      await this.props.httpClient.post(`/api/v1/scene/${this.props.scene_selector}/start`);
      this.setState({ saving: false });
    } catch (e) {
      this.setState({ saving: false });
    }
  };
  stopScene = async () => {
    try {
      await this.props.httpClient.post(`/api/v1/scene/${this.props.scene_selector}/stop`);
    } catch (e) {
      console.error(e);
    }
  };
  getRunningScenes = async () => {
    // stops received while the request is in flight would be undone by the response
    const stoppedDuringFetch = new Set();
    this.stoppedDuringFetch = stoppedDuringFetch;
    try {
      const runningScenes = await this.props.httpClient.get('/api/v1/scene/running');
      // This page only displays the edited scene, so keep only its executions
      // (this also scopes the ticker to the edited scene).
      const forThisScene = runningScenes.filter(
        runningScene => runningScene.sceneSelector === this.props.scene_selector
      );
      this.setState(prevState => ({
        runningScenes: mergeRunningScenes(forThisScene, prevState.runningScenes, stoppedDuringFetch)
      }));
    } catch (e) {
      console.error(e);
    } finally {
      if (this.stoppedDuringFetch === stoppedDuringFetch) {
        this.stoppedDuringFetch = null;
      }
    }
  };
  onSceneStarted = payload => {
    if (payload.sceneSelector !== this.props.scene_selector) {
      return;
    }
    this.setState(prevState => {
      const alreadyKnown = prevState.runningScenes.some(scene => scene.executionId === payload.executionId);
      if (alreadyKnown) {
        return null;
      }
      return { runningScenes: [...prevState.runningScenes, payload] };
    });
  };
  onSceneStopped = payload => {
    if (this.stoppedDuringFetch) {
      this.stoppedDuringFetch.add(payload.executionId);
    }
    this.setState(prevState => ({
      runningScenes: prevState.runningScenes.filter(scene => scene.executionId !== payload.executionId)
    }));
  };
  // Keep a 1s ticker running only while this scene is executing, so the
  // running badge can display a live elapsed time.
  refreshTicker = () => {
    const hasRunning = this.state.runningScenes.length > 0;
    if (hasRunning && !this.ticker) {
      this.ticker = setInterval(() => this.setState({ now: Date.now() }), 1000);
    } else if (!hasRunning && this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  };
  switchActiveScene = async () => {
    this.setState({ saving: true });
    try {
      await this.setState(prevState => {
        const newState = update(prevState, {
          scene: {
            active: {
              $set: !prevState.scene.active
            }
          }
        });
        return newState;
      });
      await this.props.httpClient.patch(`/api/v1/scene/${this.props.scene_selector}`, {
        active: this.state.scene.active
      });
      // The active flag was persisted on its own: reflect it in the saved snapshot
      // without marking the rest of the scene as saved
      this.setState(prevState => {
        if (!prevState.savedSceneSnapshot) {
          return null;
        }
        const snapshot = JSON.parse(prevState.savedSceneSnapshot);
        snapshot.active = prevState.scene.active;
        return { savedSceneSnapshot: JSON.stringify(snapshot) };
      });
      this.setState({ saving: false });
    } catch (e) {
      console.error(e);
      await this.setState(prevState => {
        const newState = update(prevState, {
          saving: {
            $set: false
          },
          scene: {
            active: {
              $set: !prevState.scene.active
            }
          }
        });
        return newState;
      });
    }
  };
  saveScene = async e => {
    if (e) {
      e.preventDefault();
    }
    // Serialize the scene before the request: the local state can change while it is in
    // flight (and the "active" switch patches the scene on its own), so snapshotting the
    // state afterwards would display "saved" for data this request never sent
    const savedSceneSnapshot = JSON.stringify(this.state.scene);
    const sceneToSave = JSON.parse(savedSceneSnapshot);
    this.setState({ saving: true, error: false, errorMessage: null });
    try {
      await this.props.httpClient.patch(`/api/v1/scene/${this.props.scene_selector}`, sceneToSave);
      this.setState({ savedSceneSnapshot });
    } catch (e) {
      console.error(e);
      let errorMessage = null;
      if (e.response && e.response.data) {
        if (e.response.data.properties && e.response.data.properties.length > 0) {
          // Extract validation error messages from properties array
          errorMessage = e.response.data.properties.map(prop => prop.message).join('\n');
        } else if (e.response.data.message) {
          errorMessage = e.response.data.message;
        }
      }
      this.setState({ error: true, errorMessage });
    }
    this.setState({ saving: false });
  };

  // This function is used to check and add empty groups to the actions and variables arrays
  checkAndAddEmptyGroups = (actions, path = '', currentState) => {
    // Guard against undefined or null actions
    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return {};
    }

    let updates = {};

    // Check if we need to add a new group at the end of this level
    if (actions[actions.length - 1].length > 0) {
      if (path) {
        // We're in a nested path (inside then/else)
        // Build the nested update object dynamically
        let updateObject = {
          scene: { actions: {} },
          variables: {
            [path]: { $set: [] }
          }
        };
        let actionsPath = updateObject.scene.actions;

        // Split path and build nested structure
        path.split('.').forEach((segment, index, array) => {
          if (index === array.length - 1) {
            actionsPath[segment] = { $push: [[]] };
          } else {
            actionsPath[segment] = {};
            actionsPath = actionsPath[segment];
          }
        });

        updates = updateObject;
      } else {
        // We're at the root level
        updates = {
          scene: {
            actions: {
              $push: [[]]
            }
          },
          variables: {
            [path]: {
              $set: []
            }
          }
        };
      }
    }

    // Process nested conditions
    actions.forEach((actionGroup, groupIndex) => {
      actionGroup.forEach((action, actionIndex) => {
        if (action && (action.type === ACTIONS.CONDITION.IF_THEN_ELSE || action.type === ACTIONS.CONDITION.WHILE)) {
          if (Array.isArray(action.then)) {
            const thenPath = path ? `${path}.${groupIndex}.${actionIndex}.then` : `${groupIndex}.${actionIndex}.then`;
            const thenUpdates = this.checkAndAddEmptyGroups(action.then, thenPath, currentState);
            // Merge the updates instead of using update()
            updates = deepMergeUpdates(updates, thenUpdates);
          }

          if (Array.isArray(action.else)) {
            const elsePath = path ? `${path}.${groupIndex}.${actionIndex}.else` : `${groupIndex}.${actionIndex}.else`;
            const elseUpdates = this.checkAndAddEmptyGroups(action.else, elsePath, currentState);
            // Merge the updates instead of using update()
            updates = deepMergeUpdates(updates, elseUpdates);
          }
        }
      });
    });

    return updates;
  };

  addEmptyActionGroupIfNeeded = async () => {
    const { actions } = this.state.scene;
    const updates = this.checkAndAddEmptyGroups(actions, '', this.state);

    const newState = update(this.state, updates);

    await this.setState(newState);
  };

  addActionGroupAfter = async index => {
    // Update variable paths for all actions after the inserted group
    await this.setState(prevState => {
      // The new paths are written in a fresh map: copying the previous variables and deleting the
      // renamed paths would drop a variable whose new path is the previous path of another one
      // (e.g. "1.0" renamed to "2.0", then "2.0" renamed to "3.0" and its previous path deleted).
      const newVariables = {};

      const pathToUpdateInVariables = [];

      // Iterate through all variables and update their paths
      Object.entries(prevState.variables).forEach(([path, value]) => {
        const pathSegments = path.split('.');

        // Handle both root level paths and nested paths in then/else
        if (pathSegments.length >= 2) {
          // Check if this is a root level path (e.g., "1.0")
          if (pathSegments.length === 2) {
            const groupIndex = parseInt(pathSegments[0], 10);

            // If this path is after the inserted group, increment index
            if (groupIndex >= index + 1) {
              const newPath = `${groupIndex + 1}.${pathSegments[1]}`;
              newVariables[newPath] = value;
              pathToUpdateInVariables.push({ prevPath: path, newPath, groupIndex });
              return;
            }
          } else {
            // Handle nested paths (e.g., "1.0.then.0.0" or "1.0.else.0.0")
            // Find the root group index which is the first segment
            const rootGroupIndex = parseInt(pathSegments[0], 10);

            // Only update if the root group index is affected by the insertion
            if (rootGroupIndex >= index + 1) {
              // Create a new path with incremented root group index
              const newPathSegments = [...pathSegments];
              newPathSegments[0] = (rootGroupIndex + 1).toString();
              const newPath = newPathSegments.join('.');

              newVariables[newPath] = value;
              pathToUpdateInVariables.push({ prevPath: path, newPath, groupIndex: rootGroupIndex });
              return;
            }
          }
        }

        // The paths which are not affected by the insertion are kept as they are
        newVariables[path] = value;
      });

      const newScene = update(prevState.scene, {
        actions: {
          $splice: [[index + 1, 0, []]]
        }
      });

      // Update the references to the variables of all the actions after the inserted group.
      // Indexes are incremented, so we start with the biggest one to never rewrite a path twice.
      pathToUpdateInVariables.sort((a, b) => b.groupIndex - a.groupIndex);
      replaceVariablePathsInActions(prevState.scene.actions, pathToUpdateInVariables);

      return {
        variables: newVariables,
        scene: newScene
      };
    });
  };

  addAction = async (path, options = {}) => {
    await this.setState(prevState => {
      // Build the nested update object for actions
      const pathSegments = path.split('.');
      let updateObject = { scene: { actions: {} } };
      let current = updateObject.scene.actions;

      pathSegments.forEach((segment, index) => {
        if (index === pathSegments.length - 1) {
          current[segment] = {
            $push: [
              {
                type: null,
                ...options
              }
            ]
          };
        } else {
          current[segment] = {};
          current = current[segment];
        }
      });

      // Add empty variables array for the new action
      const newVariables = {
        ...prevState.variables,
        [path]: []
      };

      return update(prevState, {
        ...updateObject,
        variables: { $set: newVariables }
      });
    });

    await this.addEmptyActionGroupIfNeeded();
  };

  deleteActionGroup = path => {
    this.setState(prevState => {
      // Split the path into segments
      const pathSegments = path.split('.');

      // The action groups which follow the deleted one are shifted one index down, so the
      // variables they declare must be renamed, and the references to those variables in the
      // whole scene must be updated (the same way they are when a group is inserted).
      const containerSegments = pathSegments.slice(0, -1);
      const deletedGroupIndex = parseInt(pathSegments[pathSegments.length - 1], 10);
      const newVariables = {};
      const pathToUpdateInVariables = [];

      Object.entries(prevState.variables).forEach(([variablePath, value]) => {
        const variableSegments = variablePath.split('.');
        // A variable belongs to the deleted group or to one of its siblings only if it is
        // declared in the same container (the root level, or a "then"/"else" branch)
        const isInSameContainer =
          variableSegments.length > containerSegments.length &&
          containerSegments.every((segment, index) => segment === variableSegments[index]);
        const groupIndex = isInSameContainer ? parseInt(variableSegments[containerSegments.length], 10) : NaN;

        if (Number.isNaN(groupIndex) || groupIndex < deletedGroupIndex) {
          newVariables[variablePath] = value;
          return;
        }

        // The variables declared in the deleted group are removed
        if (groupIndex === deletedGroupIndex) {
          return;
        }

        const newPathSegments = [...variableSegments];
        newPathSegments[containerSegments.length] = `${groupIndex - 1}`;
        const newPath = newPathSegments.join('.');
        newVariables[newPath] = value;
        pathToUpdateInVariables.push({ prevPath: variablePath, newPath, groupIndex });
      });

      // Indexes are decremented, so we start with the smallest one to never rewrite a path twice.
      pathToUpdateInVariables.sort((a, b) => a.groupIndex - b.groupIndex);
      replaceVariablePathsInActions(prevState.scene.actions, pathToUpdateInVariables);

      // If it's a root level deletion (e.g., "1")
      if (pathSegments.length === 1) {
        return update(prevState, {
          scene: {
            actions: {
              $splice: [[parseInt(pathSegments[0], 10), 1]]
            }
          },
          variables: {
            $set: newVariables
          }
        });
      }

      // Build the nested update object
      let updateObject = {
        scene: { actions: {} },
        variables: {
          $set: newVariables
        }
      };
      let actionsPath = updateObject.scene.actions;

      // Build the nested structure up to the second-to-last segment
      pathSegments.forEach((segment, index) => {
        // Special handling for 'then' and 'else' segments
        if (segment === 'then' || segment === 'else') {
          actionsPath[segment] = {};
          actionsPath = actionsPath[segment];
          return;
        }

        if (index === pathSegments.length - 1) {
          // Last segment - perform the splice
          actionsPath.$splice = [[parseInt(segment, 10), 1]];
        } else if (index < pathSegments.length - 1) {
          // Not the last segment - continue building the path
          const nextSegment = pathSegments[index + 1];
          if (nextSegment === 'then' || nextSegment === 'else') {
            // If next segment is then/else, current segment needs numeric index
            actionsPath[parseInt(segment, 10)] = {};
            actionsPath = actionsPath[parseInt(segment, 10)];
          } else {
            // Regular path building
            actionsPath[segment] = {};
            actionsPath = actionsPath[segment];
          }
        }
      });

      return update(prevState, updateObject);
    });
  };

  deleteAction = path => {
    // Deleting the only action of a step in the middle of the flow leaves an empty group
    // behind, which renders as a stray "add a step" button: drop it, as a drag & drop does
    const cleanUpEmptyGroup = () => this.cleanUpEmptyGroupAfterMove(path);
    this.setState(prevState => {
      // Remove the action
      const pathSegments = path.split('.');
      let updateObject = { scene: { actions: {} } };
      let current = updateObject.scene.actions;

      pathSegments.forEach((segment, index) => {
        if (index === pathSegments.length - 2) {
          current[segment] = {
            $splice: [[parseInt(pathSegments[index + 1], 10), 1]]
          };
        } else if (index < pathSegments.length - 2) {
          current[segment] = {};
          current = current[segment];
        }
      });

      // Remove variables for the deleted action and update paths for subsequent actions
      const newVariables = { ...prevState.variables };
      delete newVariables[path];

      // Update paths for actions after the deleted one
      Object.keys(newVariables).forEach(varPath => {
        // Check if the variable path is in the same parent group as the deleted action
        if (
          varPath.startsWith(
            path
              .split('.')
              .slice(0, -1)
              .join('.')
          )
        ) {
          const remainingVars = newVariables[varPath];
          delete newVariables[varPath];
          const newPath = this.updatePathAfterDeletion(varPath, path);
          if (newPath) {
            newVariables[newPath] = remainingVars;
          }
        }
      });

      // Check if we need to remove an empty action group
      // Only if we are not in a "if" action
      if (!path.includes('if')) {
        const parentPath = path
          .split('.')
          .slice(0, -1)
          .join('.');
        const parentSegments = parentPath.split('.');

        // Get the current action group and check if it will be empty after deletion
        let actionGroup = prevState.scene.actions;
        let nextGroupIndex = null;

        // Navigate to the correct action group based on the path
        for (let i = 0; i < parentSegments.length; i++) {
          const segment = parentSegments[i];
          if (segment === 'then' || segment === 'else') {
            actionGroup = actionGroup[segment];
          } else {
            actionGroup = actionGroup[parseInt(segment, 10)];
          }
        }

        // Check if the current action group will be empty after deletion
        // and if there's a next action group to potentially delete
        const willBeEmpty = actionGroup.length === 1;

        // Handle root level action groups
        if (parentSegments.length === 1) {
          const groupIndex = parseInt(parentSegments[0], 10);
          nextGroupIndex = groupIndex + 1;

          // If current group will be empty and next group exists and is empty
          if (
            willBeEmpty &&
            nextGroupIndex < prevState.scene.actions.length &&
            prevState.scene.actions[nextGroupIndex].length === 0
          ) {
            // Add deletion of next group to updateObject
            if (!updateObject.scene.actions.$splice) {
              updateObject.scene.actions.$splice = [];
            }
            updateObject.scene.actions.$splice.push([nextGroupIndex, 1]);
          }
        } else if (parentSegments.length > 1) {
          // Handle nested action groups (inside then/else)
          let container = prevState.scene.actions;

          // Navigate to the container
          for (let i = 0; i < parentSegments.length - 1; i++) {
            const segment = parentSegments[i];
            if (segment === 'then' || segment === 'else') {
              container = container[segment];
            } else {
              container = container[parseInt(segment, 10)];
            }
          }

          const groupIndex = parseInt(parentSegments[parentSegments.length - 1], 10);
          nextGroupIndex = groupIndex + 1;

          // If current group will be empty and next group exists and is empty
          if (willBeEmpty && nextGroupIndex < container.length && container[nextGroupIndex].length === 0) {
            // Build nested update for the container
            let nestedUpdate = { scene: { actions: {} } };
            let currentNested = nestedUpdate.scene.actions;

            // Build the path to the container
            for (let i = 0; i < parentSegments.length - 1; i++) {
              const segment = parentSegments[i];
              if (segment === 'then' || segment === 'else') {
                currentNested[segment] = {};
                currentNested = currentNested[segment];
              } else {
                currentNested[parseInt(segment, 10)] = {};
                currentNested = currentNested[parseInt(segment, 10)];
              }
            }

            // Add splice operation to delete the next group
            currentNested.$splice = [[nextGroupIndex, 1]];

            // Merge this update with the main updateObject
            updateObject = deepMergeUpdates(updateObject, nestedUpdate);
          }
        }
      }

      return update(prevState, {
        ...updateObject,
        variables: { $set: newVariables }
      });
    }, cleanUpEmptyGroup);
  };

  updatePathAfterDeletion = (currentPath, deletedPath) => {
    const currentSegments = currentPath.split('.');
    const deletedSegments = deletedPath.split('.');
    const lastDeletedIndex = parseInt(deletedSegments[deletedSegments.length - 1], 10);

    // Get the parent paths to compare them
    const currentParentPath = currentSegments.slice(0, -1).join('.');
    const deletedParentPath = deletedSegments.slice(0, -1).join('.');

    // If they are in the same parent group
    if (currentParentPath === deletedParentPath) {
      const currentIndex = parseInt(currentSegments[currentSegments.length - 1], 10);
      if (currentIndex > lastDeletedIndex) {
        currentSegments[currentSegments.length - 1] = (currentIndex - 1).toString();
        return currentSegments.join('.');
      }
    }

    // If not in the same group, keep the original path
    return currentPath;
  };

  updateActionProperty = (path, property, value) => {
    this.setState(prevState => {
      // Split the path into segments
      const pathSegments = path.split('.');

      // Build the nested update object
      let updateObject = { scene: { actions: {} } };
      let current = updateObject.scene.actions;

      // Build the nested structure based on path
      pathSegments.forEach((segment, index) => {
        if (index === pathSegments.length - 1) {
          current[segment] = {
            [property]: { $set: value }
          };
        } else {
          current[segment] = {};
          current = current[segment];
        }
      });

      return update(prevState, updateObject);
    });
  };

  highlighCurrentlyExecutedAction = ({ columnIndex, rowIndex }) => {
    this.setState({
      highLightedActions: {
        [`${columnIndex}:${rowIndex}`]: true
      }
    });
  };
  removeHighlighAction = ({ columnIndex, rowIndex }) => {
    setTimeout(() => {
      this.setState({
        highLightedActions: {
          [`${columnIndex}:${rowIndex}`]: false
        }
      });
    }, 500);
  };

  askDeleteCurrentScene = async () => {
    await this.setState({
      askDeleteScene: true
    });
  };

  cancelDeleteCurrentScene = async () => {
    await this.setState({
      askDeleteScene: false
    });
  };

  goBack = () => {
    route(`/dashboard/scene${window.location.search}`);
  };

  deleteScene = async () => {
    this.setState({ saving: true });
    try {
      await this.props.httpClient.delete(`/api/v1/scene/${this.props.scene_selector}`);
      this.setState({ saving: false });
      this.goBack();
    } catch (e) {
      this.setState({ saving: false });
    }
  };
  addTrigger = () => {
    this.setState(prevState => {
      const newState = update(prevState, {
        scene: {
          triggers: {
            $push: [
              {
                type: null
              }
            ]
          }
        },
        triggersVariables: {
          $push: [[]]
        }
      });
      return newState;
    });
  };
  deleteTrigger = index => {
    this.setState(prevState => {
      const newState = update(prevState, {
        scene: {
          triggers: {
            $splice: [[index, 1]]
          }
        },
        triggersVariables: {
          $splice: [[index, 1]]
        }
      });
      return newState;
    });
  };
  updateTriggerProperty = (index, property, value) => {
    this.setState(prevState => {
      const newState = update(prevState, {
        scene: {
          triggers: {
            [index]: {
              [property]: {
                $set: value
              }
            }
          }
        }
      });
      return newState;
    });
  };

  setVariables = (path, newVariables) => {
    this.setState(prevState => ({
      variables: {
        ...prevState.variables,
        [path]: newVariables
      }
    }));
  };

  setVariablesTrigger = (index, variables) => {
    this.setState(prevState => {
      const newState = update(prevState, {
        triggersVariables: {
          [index]: {
            $set: variables
          }
        }
      });
      return newState;
    });
  };

  updateSceneName = e => {
    this.setState(prevState => {
      const newState = update(prevState, {
        scene: {
          name: {
            $set: e.target.value
          }
        }
      });
      return newState;
    });
  };

  updateSceneDescription = e => {
    this.setState(prevState => {
      const newState = update(prevState, {
        scene: {
          description: {
            $set: e.target.value
          }
        }
      });
      return newState;
    });
  };

  updateSceneIcon = e => {
    this.setState(prevState => {
      const newState = update(prevState, {
        scene: {
          icon: {
            $set: e.target.value
          }
        }
      });
      return newState;
    });
  };

  duplicateScene = () => {
    route(`/dashboard/scene/${this.props.scene_selector}/duplicate`);
  };

  // After a card moved out of its group, remove the group if it became empty,
  // unless it is the trailing empty group of its container, which is the
  // "add a step" insertion point. Without this, dragging the only action of a
  // step elsewhere leaves stray "add a step" buttons in the middle of the flow.
  cleanUpEmptyGroupAfterMove = async sourceActionPath => {
    const groupSegments = sourceActionPath.split('.').slice(0, -1);
    // Conditions of if/while blocks are a flat list, not action groups
    if (groupSegments.includes('if') || groupSegments.length === 0) {
      return;
    }
    const containerSegments = groupSegments.slice(0, -1);
    const groupIndex = parseInt(groupSegments[groupSegments.length - 1], 10);
    const container = this.getActionContainer(containerSegments);
    if (!container) {
      return;
    }
    const group = container[groupIndex];
    if (Array.isArray(group) && group.length === 0 && groupIndex < container.length - 1) {
      await this.deleteActionGroup(groupSegments.join('.'));
    }
  };

  // Returns the list of action groups designated by a path (the root level, or the "then" /
  // "else" branch of an if/while block), or null when the path does not designate one
  getActionContainer = containerSegments => {
    let container = this.state.scene.actions;
    for (const segment of containerSegments) {
      container = segment === 'then' || segment === 'else' ? container[segment] : container[parseInt(segment, 10)];
      if (!Array.isArray(container)) {
        return null;
      }
    }
    return container;
  };

  // A group holding a single action renders as a plain step, without any group chrome: dropping
  // such a step onto another one must reorder the flow, not merge them into an "at the same
  // time" block. Parallelism stays opt-in, through the "add a parallel action" control.
  isSequentialStepReorder = (originalPath, destPath) => {
    const sourceGroupSegments = originalPath.split('.').slice(0, -1);
    const destGroupSegments = destPath.split('.').slice(0, -1);
    // Conditions of if/while blocks are a flat list, not action groups
    if (sourceGroupSegments.includes('if') || destGroupSegments.includes('if')) {
      return false;
    }
    const sourceContainerSegments = sourceGroupSegments.slice(0, -1);
    const destContainerSegments = destGroupSegments.slice(0, -1);
    // Only two steps of the same container are reordered: moving an action to another
    // container (in or out of a branch) keeps inserting it in the destination group
    if (
      sourceGroupSegments.length === 0 ||
      sourceGroupSegments.join('.') === destGroupSegments.join('.') ||
      sourceContainerSegments.join('.') !== destContainerSegments.join('.')
    ) {
      return false;
    }
    const container = this.getActionContainer(sourceContainerSegments);
    if (!container) {
      return false;
    }
    const sourceGroup = container[parseInt(sourceGroupSegments[sourceGroupSegments.length - 1], 10)];
    const destGroup = container[parseInt(destGroupSegments[destGroupSegments.length - 1], 10)];
    return Array.isArray(sourceGroup) && Array.isArray(destGroup) && sourceGroup.length === 1 && destGroup.length === 1;
  };

  moveCard = async (originalPath, destPath) => {
    if (this.isSequentialStepReorder(originalPath, destPath)) {
      return this.moveCardGroup(
        originalPath
          .split('.')
          .slice(0, -1)
          .join('.'),
        destPath
          .split('.')
          .slice(0, -1)
          .join('.')
      );
    }
    // Helper function to get nested value using path
    const getNestedValue = (obj, path) => {
      return path.split('.').reduce((acc, key) => acc && acc[key], obj);
    };

    // Helper function to check if path exists and is valid
    const isValidPath = (actions, path) => {
      const segments = path.split('.');
      let current = actions;

      for (let i = 0; i < segments.length - 1; i++) {
        current = current && current[segments[i]];
        if (!current) return false;
      }

      const lastSegment = parseInt(segments[segments.length - 1], 10);
      return current && lastSegment >= 0 && lastSegment <= current.length;
    };

    // Validate destination path
    if (!isValidPath(this.state.scene.actions, destPath)) {
      return null;
    }

    // Get the element and variable at original path
    const element = getNestedValue(this.state.scene.actions, originalPath);

    if (!element) return null;

    // Build update object for removing from original location
    let removeUpdateObject = { scene: { actions: {} } };
    let removeActionsPath = removeUpdateObject.scene.actions;

    originalPath.split('.').forEach((segment, index, array) => {
      if (index === array.length - 2) {
        removeActionsPath[segment] = {
          $splice: [[parseInt(array[array.length - 1], 10), 1]]
        };
      } else if (index < array.length - 2) {
        removeActionsPath[segment] = {};
        removeActionsPath = removeActionsPath[segment];
      }
    });

    // Remove element from original location
    const newStateWithoutElement = update(this.state, removeUpdateObject);

    // Build update object for adding to destination
    let addUpdateObject = { scene: { actions: {} }, variables: {} };
    let addActionsPath = addUpdateObject.scene.actions;

    destPath.split('.').forEach((segment, index, array) => {
      if (index === array.length - 2) {
        addActionsPath[segment] = {
          $splice: [[parseInt(array[array.length - 1], 10), 0, element]]
        };
      } else if (index < array.length - 2) {
        addActionsPath[segment] = {};
        addActionsPath = addActionsPath[segment];
      }
    });

    // Update variables - handle all affected variables
    const updatedVariables = {};
    Object.entries(this.state.variables).forEach(([path, value]) => {
      let newPath;

      // Check if we're moving within the same parent (swapping case)
      if (
        originalPath
          .substring(0, originalPath.lastIndexOf('.'))
          .startsWith(destPath.substring(0, destPath.lastIndexOf('.')))
      ) {
        if (path.startsWith(originalPath.substring(0, originalPath.lastIndexOf('.')))) {
          const pathIndex = parseInt(path.split('.').pop(), 10);

          if (pathIndex === parseInt(originalPath.split('.').pop(), 10)) {
            // Moving this variable to destination
            newPath = destPath;
          } else if (pathIndex === parseInt(destPath.split('.').pop(), 10)) {
            // The destination variable moves to original position
            newPath = originalPath;
          }
        }
      } else {
        // Handle non-swapping case (moving between different parents)
        if (path.startsWith(originalPath.substring(0, originalPath.lastIndexOf('.')))) {
          const pathIndex = parseInt(path.split('.').pop(), 10);

          if (path === originalPath) {
            // This is the moved variable
            newPath = destPath;
          } else if (pathIndex > parseInt(originalPath.split('.').pop(), 10)) {
            // This variable was after the moved one in the original location
            const newIndex = pathIndex - 1;
            newPath = `${originalPath.substring(0, originalPath.lastIndexOf('.'))}.${newIndex}`;
          }
        }

        // If the path starts with the destination path prefix
        if (path.startsWith(destPath.substring(0, destPath.lastIndexOf('.')))) {
          const pathIndex = parseInt(path.split('.').pop(), 10);
          if (pathIndex >= parseInt(destPath.split('.').pop(), 10)) {
            // This variable needs to be shifted up
            const newIndex = pathIndex + 1;
            newPath = `${destPath.substring(0, destPath.lastIndexOf('.'))}.${newIndex}`;
          }
        }
      }

      if (newPath) {
        updatedVariables[newPath] = { $set: value };
      }
    });

    // Add variables to the update object
    addUpdateObject.variables = updatedVariables;

    // Add element to new location and update variables
    const newState = update(newStateWithoutElement, addUpdateObject);

    await this.setState(newState);
    await this.addEmptyActionGroupIfNeeded();
    await this.cleanUpEmptyGroupAfterMove(originalPath);
  };

  moveCardGroup = async (sourcePath, destPath) => {
    const getElementByPath = path => {
      const parts = path.split('.');
      const lastPart = parts.pop();
      const arrayPath = parts.join('.');

      const array = arrayPath ? get(this.state.scene.actions, arrayPath) : this.state.scene.actions;

      if (!Array.isArray(array)) {
        throw new Error('Invalid path: could not find target array');
      }

      return {
        array,
        index: parseInt(lastPart, 10)
      };
    };

    try {
      const source = getElementByPath(sourcePath);
      const dest = getElementByPath(destPath);

      // Validate indices
      if (dest.index < 0 || dest.index > dest.array.length) {
        return null;
      }

      // Get the element to move
      const element = source.array[source.index];

      // The paths of the groups whose index changes, computed before the arrays are mutated
      const movedGroupPaths = buildMovedGroupPaths({
        sourcePath,
        sourceLength: source.array.length,
        destPath,
        destLength: dest.array.length
      });

      // Create new state by first removing from source
      let newState = { ...this.state };
      source.array.splice(source.index, 1);

      // Then insert at destination
      dest.array.splice(dest.index, 0, element);

      // Rename the variables declared by the groups which moved, and update the references to
      // those variables in the whole scene, so that it stays coherent
      const newVariables = renameVariablesOfMovedGroups(this.state.variables, movedGroupPaths);
      replaceMovedGroupPathsInActions(this.state.scene.actions, movedGroupPaths);

      // Set the new state
      await this.setState({
        ...newState,
        variables: newVariables
      });

      await this.addEmptyActionGroupIfNeeded();
    } catch (error) {
      console.error('Error moving card group:', error);
      return null;
    }
  };

  setTags = tags => {
    this.setState(prevState => {
      const newState = update(prevState, {
        scene: {
          tags: {
            $set: tags.map(tag => ({ name: tag }))
          }
        }
      });
      return newState;
    });
  };

  getTags = async () => {
    try {
      const tags = await this.props.httpClient.get(`/api/v1/tag_scene`);
      this.setState({
        tags
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Recursively generate all possible action group types based on nesting level
  generateActionGroupTypes = (actions, parentPath = '') => {
    if (!actions || !Array.isArray(actions)) {
      return [];
    }

    // Start with the current level
    let types = [];
    const currentLevel = parentPath.split('.').length;

    // Add the current level if not already in the list
    if (!parentPath.endsWith('then') && !parentPath.endsWith('else')) {
      const groupType = `ACTION_GROUP_TYPE_LEVEL_${currentLevel}`;
      if (!types.includes(groupType)) {
        types.push(groupType);
      }
    }

    // Recursively process each action group and its actions
    actions.forEach((actionGroup, groupIndex) => {
      const groupPath = parentPath ? `${parentPath}.${groupIndex}` : `${groupIndex}`;

      const groupType = `ACTION_GROUP_TYPE_LEVEL_${groupPath.split('.').length}`;
      if (!types.includes(groupType)) {
        types.push(groupType);
      }

      // Process each action in the group
      if (Array.isArray(actionGroup)) {
        actionGroup.forEach((action, actionIndex) => {
          const actionPath = `${groupPath}.${actionIndex}`;

          // Check if this is a conditional action with nested actions
          if (action && (action.type === ACTIONS.CONDITION.IF_THEN_ELSE || action.type === ACTIONS.CONDITION.WHILE)) {
            // Process 'then' branch
            if (Array.isArray(action.then)) {
              const thenTypes = this.generateActionGroupTypes(action.then, `${actionPath}.then`);
              types = [...types, ...thenTypes];
            }

            // Process 'else' branch
            if (Array.isArray(action.else)) {
              const elseTypes = this.generateActionGroupTypes(action.else, `${actionPath}.else`);
              types = [...types, ...elseTypes];
            }
          }
        });
      }
    });

    // Remove duplicates
    return [...new Set(types)];
  };

  constructor(props) {
    super(props);
    this.state = {
      scene: null,
      variables: {},
      triggersVariables: [],
      runningScenes: [],
      now: Date.now()
    };
    this.ticker = null;
  }

  componentDidMount() {
    this.getSceneBySelector();
    this.getTags();
    this.getRunningScenes();
    this.props.session.dispatcher.addListener('scene.executing-action', payload =>
      this.highlighCurrentlyExecutedAction(payload)
    );
    this.props.session.dispatcher.addListener('scene.finished-executing-action', payload =>
      this.removeHighlighAction(payload)
    );
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.SCENE.STARTED, this.onSceneStarted);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.SCENE.STOPPED, this.onSceneStopped);
  }

  componentDidUpdate() {
    // Start/stop the ticker based on the applied state.
    this.refreshTicker();
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.closeEdition, true);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.SCENE.STARTED, this.onSceneStarted);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.SCENE.STOPPED, this.onSceneStopped);
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }

  render(
    props,
    {
      saving,
      error,
      errorMessage,
      variables,
      scene,
      triggersVariables,
      tags,
      askDeleteScene,
      runningScenes,
      now,
      savedSceneSnapshot
    }
  ) {
    const actionsGroupTypes = this.generateActionGroupTypes(scene ? scene.actions : []);
    const { backend, options } = getDragAndDropBackend();
    const runningInfo = computeRunningInfo(runningScenes, props.scene_selector, now);
    const hasUnsavedChanges = Boolean(scene && savedSceneSnapshot && JSON.stringify(scene) !== savedSceneSnapshot);
    return (
      scene && (
        <div>
          <DndProvider backend={backend} options={options}>
            <EditScenePage
              {...props}
              scene={scene}
              hasUnsavedChanges={hasUnsavedChanges}
              runningInfo={runningInfo}
              stopScene={this.stopScene}
              tags={tags}
              actionsGroupTypes={actionsGroupTypes}
              updateActionProperty={this.updateActionProperty}
              updateTriggerProperty={this.updateTriggerProperty}
              addAction={this.addAction}
              deleteActionGroup={this.deleteActionGroup}
              deleteAction={this.deleteAction}
              addTrigger={this.addTrigger}
              deleteTrigger={this.deleteTrigger}
              saving={saving}
              error={error}
              errorMessage={errorMessage}
              variables={variables}
              triggersVariables={triggersVariables}
              setVariables={this.setVariables}
              setVariablesTrigger={this.setVariablesTrigger}
              switchActiveScene={this.switchActiveScene}
              updateSceneName={this.updateSceneName}
              moveCard={this.moveCard}
              moveCardGroup={this.moveCardGroup}
              updateSceneDescription={this.updateSceneDescription}
              startScene={this.startScene}
              deleteScene={this.deleteScene}
              saveScene={this.saveScene}
              duplicateScene={this.duplicateScene}
              setTags={this.setTags}
              updateSceneIcon={this.updateSceneIcon}
              addActionGroupAfter={this.addActionGroupAfter}
              askDeleteScene={askDeleteScene}
              askDeleteCurrentScene={this.askDeleteCurrentScene}
              cancelDeleteCurrentScene={this.cancelDeleteCurrentScene}
              goBack={this.goBack}
            />
          </DndProvider>
        </div>
      )
    );
  }
}

export default connect('session,httpClient', {})(EditScene);
