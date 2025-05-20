import { Component } from 'preact';
import { connect } from 'unistore/preact';
import update from 'immutability-helper';
import { route } from 'preact-router';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';
import get from 'get-value'; // Import get-value package

import { RequestStatus } from '../../../utils/consts';
import EditScenePage from './EditScenePage';

import { ACTIONS } from '../../../../../server/utils/constants';

const VARIABLES_ATTRIBUTES_IN_ACTION = {
  [ACTIONS.MESSAGE.SEND]: ['text'],
  [ACTIONS.AI.ASK]: ['text'],
  [ACTIONS.MESSAGE.SEND_CAMERA]: ['text'],
  [ACTIONS.SMS.SEND]: ['text'],
  [ACTIONS.MUSIC.PLAY_NOTIFICATION]: ['text'],
  [ACTIONS.MQTT.SEND]: ['message'],
  [ACTIONS.ZIGBEE2MQTT.SEND]: ['message'],
  [ACTIONS.DEVICE.SET_VALUE]: ['evaluate_value'],
  [ACTIONS.HTTP.REQUEST]: ['body'],
  [ACTIONS.CONDITION.ONLY_CONTINUE_IF]: ['conditions[].evaluate_value', 'conditions[].variable']
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
      if (action && action.type === ACTIONS.CONDITION.IF_THEN_ELSE) {
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
      if (scene.actions[scene.actions.length - 1].length > 0) {
        scene.actions.push([]);
      }
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
    this.setState({ saving: true });
    try {
      await this.props.httpClient.post(`/api/v1/scene/${this.props.scene_selector}/start`);
      this.setState({ saving: false });
    } catch (e) {
      this.setState({ saving: false });
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
    this.setState({ saving: true, error: false });
    try {
      await this.props.httpClient.patch(`/api/v1/scene/${this.props.scene_selector}`, this.state.scene);
    } catch (e) {
      console.error(e);
      this.setState({ error: true });
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
        if (action && action.type === ACTIONS.CONDITION.IF_THEN_ELSE) {
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
      const newVariables = { ...prevState.variables };

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
              delete newVariables[path];
              pathToUpdateInVariables.push({ prevPath: path, newPath });
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
              delete newVariables[path];
              pathToUpdateInVariables.push({ prevPath: path, newPath });
            }
          }
        }
      });

      const newScene = update(prevState.scene, {
        actions: {
          $splice: [[index + 1, 0, []]]
        }
      });

      // Update variable paths for all actions after the inserted group
      pathToUpdateInVariables.reverse().forEach(({ prevPath, newPath }) => {
        // Recursive function to process all actions, including nested ones in if/then/else blocks
        const processActions = actions => {
          if (!Array.isArray(actions)) return;

          actions.forEach(actionGroup => {
            if (!Array.isArray(actionGroup)) return;

            actionGroup.forEach(action => {
              if (!action) return;

              // Process the current action
              if (VARIABLES_ATTRIBUTES_IN_ACTION[action.type]) {
                VARIABLES_ATTRIBUTES_IN_ACTION[action.type].forEach(attribute => {
                  // In case there are 2 parts in the attribute (e.g., conditions[0].variable)
                  if (attribute.includes('.')) {
                    // We split the attribute path
                    const attributePath = attribute.split('.');
                    // If the first part is an array (e.g., conditions[])
                    if (attributePath[0].endsWith('[]') && action[attributePath[0].slice(0, -2)]) {
                      // We loop through the array
                      action[attributePath[0].slice(0, -2)].forEach(subAction => {
                        if (subAction[attributePath[1]] && subAction[attributePath[1]].includes(prevPath)) {
                          // And replace the second part if it is a variable
                          // Here, we don't prefix prevPath by {{ because if it's a variable, it's not prefixed by {{
                          subAction[attributePath[1]] = subAction[attributePath[1]].replace(prevPath, newPath);
                        }
                      });
                    }
                  } else if (action[attribute]) {
                    // In that case, we prefix prevPath by {{ because it's usually a text like "The temperature is {{variable}}°C".
                    action[attribute] = action[attribute].replace(`{{${prevPath}.`, `{{${newPath}.`);
                  }
                });
              }

              // Check for nested actions in if/then/else blocks
              if (action.type === ACTIONS.CONDITION.IF_THEN_ELSE) {
                // Process 'if' branch if it exists
                if (Array.isArray(action.if)) {
                  processActions([action.if]);
                }

                // Process 'then' branch if it exists
                if (Array.isArray(action.then)) {
                  processActions(action.then);
                }

                // Process 'else' branch if it exists
                if (Array.isArray(action.else)) {
                  processActions(action.else);
                }
              }
            });
          });
        };

        // Start processing from the root actions
        processActions(prevState.scene.actions);
      });

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

      // Handle variables
      const newVariables = {
        ...prevState.variables
      };
      Object.keys(prevState.variables)
        .filter(variablePath => variablePath.startsWith(path))
        .forEach(pathToDelete => {
          delete newVariables[pathToDelete];
        });

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
    });
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

  deleteScene = async () => {
    this.setState({ saving: true });
    try {
      await this.props.httpClient.delete(`/api/v1/scene/${this.props.scene_selector}`);
      this.setState({ saving: false });
      route(`/dashboard/scene${window.location.search}`);
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

  moveCard = async (originalPath, destPath) => {
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

      // Create new state by first removing from source
      let newState = { ...this.state };
      source.array.splice(source.index, 1);

      // Then insert at destination
      dest.array.splice(dest.index, 0, element);

      // Update variables - handle all affected variables
      const newVariables = { ...this.state.variables };

      // Iterate through all variables and update their paths
      Object.entries(this.state.variables).forEach(([path, value]) => {
        // If the path starts with sourcePath, it means this variable was under the moved group
        if (path.startsWith(sourcePath)) {
          // Delete the old path
          delete newVariables[path];
          // Create new path by replacing sourcePath with destPath
          const newPath = path.replace(sourcePath, destPath);
          newVariables[newPath] = value;
        } else {
          // For variables after the source/dest positions, we need to update their indices
          const sourcePathParts = sourcePath.split('.');
          const destPathParts = destPath.split('.');
          const pathParts = path.split('.');

          // Only process if we're in the same parent path
          if (sourcePathParts.length === pathParts.length) {
            const sourceIndex = parseInt(sourcePathParts[sourcePathParts.length - 1], 10);
            const destIndex = parseInt(destPathParts[destPathParts.length - 1], 10);
            const currentIndex = parseInt(pathParts[pathParts.length - 1], 10);

            // If this path is after source and before dest, decrement index
            if (currentIndex > sourceIndex && currentIndex <= destIndex) {
              const newIndex = currentIndex - 1;
              const newPath = [...pathParts.slice(0, -1), newIndex].join('.');
              newVariables[newPath] = value;
              delete newVariables[path];
            } else if (currentIndex >= destIndex && currentIndex < sourceIndex) {
              // If this path is before source and after dest, increment index
              const newIndex = currentIndex + 1;
              const newPath = [...pathParts.slice(0, -1), newIndex].join('.');
              newVariables[newPath] = value;
              delete newVariables[path];
            }
          }
        }
      });

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
          if (action && action.type === ACTIONS.CONDITION.IF_THEN_ELSE) {
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
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    this.state = {
      scene: null,
      variables: {},
      triggersVariables: []
    };
  }

  componentDidMount() {
    this.getSceneBySelector();
    this.getTags();
    this.props.session.dispatcher.addListener('scene.executing-action', payload =>
      this.highlighCurrentlyExecutedAction(payload)
    );
    this.props.session.dispatcher.addListener('scene.finished-executing-action', payload =>
      this.removeHighlighAction(payload)
    );
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.closeEdition, true);
  }

  render(props, { saving, error, variables, scene, triggersVariables, tags, askDeleteScene }) {
    const actionsGroupTypes = this.generateActionGroupTypes(scene ? scene.actions : []);
    return (
      scene && (
        <div>
          <DndProvider backend={this.isTouchDevice ? TouchBackend : HTML5Backend}>
            <EditScenePage
              {...props}
              scene={scene}
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
            />
          </DndProvider>
        </div>
      )
    );
  }
}

export default connect('session,httpClient', {})(EditScene);
