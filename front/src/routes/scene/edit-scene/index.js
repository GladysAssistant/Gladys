import { Component } from 'preact';
import { connect } from 'unistore/preact';
import update from 'immutability-helper';
import { route } from 'preact-router';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { RequestStatus } from '../../../utils/consts';
import EditScenePage from './EditScenePage';

import { ACTIONS } from '../../../../../server/utils/constants';

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
      console.log('variables', variables);
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
      console.log(`deleteActionGroup, path = ${path}`);

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

      console.log('Update object:', JSON.stringify(updateObject, null, 2));
      console.log('New state:', JSON.stringify(update(prevState, updateObject), null, 2));
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

      return update(prevState, {
        ...updateObject,
        variables: { $set: newVariables }
      });
    });
  };

  // Helper to update paths after action deletion
  updatePathAfterDeletion = (currentPath, deletedPath) => {
    const currentSegments = currentPath.split('.');
    const deletedSegments = deletedPath.split('.');
    const lastDeletedIndex = parseInt(deletedSegments[deletedSegments.length - 1], 10);

    if (currentSegments.length === deletedSegments.length) {
      const currentIndex = parseInt(currentSegments[currentSegments.length - 1], 10);
      if (currentIndex > lastDeletedIndex) {
        currentSegments[currentSegments.length - 1] = (currentIndex - 1).toString();
        return currentSegments.join('.');
      }
    }
    return null;
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

  deleteScene = async () => {
    this.setState({ saving: true });
    try {
      await this.props.httpClient.delete(`/api/v1/scene/${this.props.scene_selector}`);
      this.setState({ saving: false });
      route('/dashboard/scene');
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
    console.log(`originalPath = ${originalPath}`);
    console.log(`destPath = ${destPath}`);

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
    const variable = getNestedValue(this.state.variables, originalPath);

    if (!element) return null;

    // Build update object for removing from original location
    let removeUpdateObject = { scene: { actions: {} }, variables: {} };
    let removeActionsPath = removeUpdateObject.scene.actions;
    let removeVariablesPath = removeUpdateObject.variables;

    originalPath.split('.').forEach((segment, index, array) => {
      if (index === array.length - 2) {
        removeActionsPath[segment] = {
          $splice: [[parseInt(array[array.length - 1], 10), 1]]
        };
        removeVariablesPath[segment] = {
          $splice: [[parseInt(array[array.length - 1], 10), 1]]
        };
      } else if (index < array.length - 2) {
        removeActionsPath[segment] = {};
        removeVariablesPath[segment] = {};
        removeActionsPath = removeActionsPath[segment];
        removeVariablesPath = removeVariablesPath[segment];
      }
    });

    // Remove element from original location
    const newStateWithoutElement = update(this.state, removeUpdateObject);

    // Build update object for adding to destination
    let addUpdateObject = { scene: { actions: {} }, variables: {} };
    let addActionsPath = addUpdateObject.scene.actions;
    let addVariablesPath = addUpdateObject.variables;

    destPath.split('.').forEach((segment, index, array) => {
      if (index === array.length - 2) {
        addActionsPath[segment] = {
          $splice: [[parseInt(array[array.length - 1], 10), 0, element]]
        };
        addVariablesPath[segment] = {
          $splice: [[parseInt(array[array.length - 1], 10), 0, variable]]
        };
      } else if (index < array.length - 2) {
        addActionsPath[segment] = {};
        addVariablesPath[segment] = {};
        addActionsPath = addActionsPath[segment];
        addVariablesPath = addVariablesPath[segment];
      }
    });

    // Add element to new location
    const newState = update(newStateWithoutElement, addUpdateObject);

    await this.setState(newState);
    await this.addEmptyActionGroupIfNeeded();
  };

  moveCardGroup = async (index, destIndex) => {
    // incorrect coordinates
    if (destIndex < 0) {
      return null;
    }

    if (destIndex >= this.state.scene.actions.length) {
      return null;
    }

    const element = this.state.scene.actions[index];
    const variable = this.state.variables[index];

    const newStateWithoutElement = update(this.state, {
      scene: {
        actions: {
          $splice: [[index, 1]]
        }
      },
      variables: {
        $splice: [[index, 1]]
      }
    });
    const newState = update(newStateWithoutElement, {
      scene: {
        actions: {
          $splice: [[destIndex, 0, element]]
        }
      },
      variables: {
        $splice: [[destIndex, 0, variable]]
      }
    });
    await this.setState(newState);
    await this.addEmptyActionGroupIfNeeded();
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

  render(props, { saving, error, variables, scene, triggersVariables, tags }) {
    return (
      scene && (
        <div>
          <DndProvider backend={this.isTouchDevice ? TouchBackend : HTML5Backend}>
            <EditScenePage
              {...props}
              scene={scene}
              tags={tags}
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
            />
          </DndProvider>
        </div>
      )
    );
  }
}

export default connect('session,httpClient', {})(EditScene);
