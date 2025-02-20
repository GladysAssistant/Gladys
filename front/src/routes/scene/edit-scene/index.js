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
      const variables = [];
      scene.actions.forEach(actionGroup => {
        variables.push(actionGroup.map(() => []));
      });
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
        let updateObject = { scene: { actions: {} }, variables: {} };
        let actionsPath = updateObject.scene.actions;
        let variablesPath = updateObject.variables;

        // Split path and build nested structure
        path.split('.').forEach((segment, index, array) => {
          if (index === array.length - 1) {
            actionsPath[segment] = { $push: [[]] };
            variablesPath[segment] = { $push: [[]] };
          } else {
            actionsPath[segment] = {};
            variablesPath[segment] = {};
            actionsPath = actionsPath[segment];
            variablesPath = variablesPath[segment];
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
            $push: [[]]
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
      // Split the path into segments
      const pathSegments = path.split('.');

      // Build the nested update object
      let updateObject = { scene: { actions: {} }, variables: {} };
      let actionsPath = updateObject.scene.actions;
      let variablesPath = updateObject.variables;

      // Build the nested structure
      pathSegments.forEach((segment, index) => {
        if (index === pathSegments.length - 1) {
          // Last segment - where we'll perform the push
          actionsPath[segment] = {
            $push: [
              {
                type: null,
                ...options
              }
            ]
          };
          variablesPath[segment] = {
            $push: [[]]
          };
        } else {
          // Build the path to nested structures
          actionsPath[segment] = {};
          actionsPath = actionsPath[segment];
          variablesPath[segment] = {};
          variablesPath = variablesPath[segment];
        }
      });

      return update(prevState, updateObject);
    });
    console.log('New variables:', JSON.stringify(this.state.variables, null, 2));

    await this.addEmptyActionGroupIfNeeded();
  };
  deleteActionGroup = path => {
    this.setState(prevState => {
      console.log(`deleteActionGroup, path = ${path}`);

      // Split the path into segments
      const pathSegments = path.split('.');

      // If it's a root level deletion (e.g., "1")
      if (pathSegments.length === 1) {
        return update(prevState, {
          scene: {
            actions: {
              $splice: [[parseInt(pathSegments[0], 10), 1]]
            }
          },
          variables: {
            $splice: [[parseInt(pathSegments[0], 10), 1]]
          }
        });
      }

      // Build the nested update object
      let updateObject = { scene: { actions: {} }, variables: {} };
      let actionsPath = updateObject.scene.actions;
      let variablesPath = updateObject.variables;

      // Build the nested structure up to the second-to-last segment
      pathSegments.forEach((segment, index) => {
        // Special handling for 'then' and 'else' segments
        if (segment === 'then' || segment === 'else') {
          actionsPath[segment] = {};
          actionsPath = actionsPath[segment];
          variablesPath[segment] = {};
          variablesPath = variablesPath[segment];
          return;
        }

        if (index === pathSegments.length - 1) {
          // Last segment - perform the splice
          actionsPath.$splice = [[parseInt(segment, 10), 1]];
          if (!segment.includes('then') && !segment.includes('else')) {
            variablesPath.$splice = [[parseInt(segment, 10), 1]];
          }
        } else if (index < pathSegments.length - 1) {
          // Not the last segment - continue building the path
          const nextSegment = pathSegments[index + 1];
          if (nextSegment === 'then' || nextSegment === 'else') {
            // If next segment is then/else, current segment needs numeric index
            actionsPath[parseInt(segment, 10)] = {};
            actionsPath = actionsPath[parseInt(segment, 10)];
            variablesPath[parseInt(segment, 10)] = {};
            variablesPath = variablesPath[parseInt(segment, 10)];
          } else {
            // Regular path building
            actionsPath[segment] = {};
            actionsPath = actionsPath[segment];
            variablesPath[segment] = {};
            variablesPath = variablesPath[segment];
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
      // Split the path into segments
      const pathSegments = path.split('.');

      // Build the nested update object
      let updateObject = { scene: { actions: {} }, variables: {} };
      let actionsPath = updateObject.scene.actions;
      let variablesPath = updateObject.variables;

      // Build the nested structure for both actions and variables
      pathSegments.forEach((segment, index) => {
        if (index === pathSegments.length - 2) {
          // Second to last segment - where we'll perform the splice
          actionsPath[segment] = {
            $splice: [[parseInt(pathSegments[index + 1], 10), 1]]
          };
          variablesPath[segment] = {
            $splice: [[parseInt(pathSegments[index + 1], 10), 1]]
          };
        } else if (index < pathSegments.length - 2) {
          // Build the path to nested structures
          actionsPath[segment] = {};
          variablesPath[segment] = {};
          actionsPath = actionsPath[segment];
          variablesPath = variablesPath[segment];
        }
      });

      let newState = update(prevState, updateObject);

      // Clean up empty action groups at the root level
      if (newState.scene.actions.length >= 2) {
        const lastGroupIndex = newState.scene.actions.length - 1;
        const secondLastGroupIndex = lastGroupIndex - 1;

        if (
          newState.scene.actions[lastGroupIndex].length === 0 &&
          newState.scene.actions[secondLastGroupIndex].length === 0
        ) {
          newState = update(newState, {
            scene: {
              actions: {
                $splice: [[lastGroupIndex, 1]]
              }
            },
            variables: {
              $splice: [[lastGroupIndex, 1]]
            }
          });
        }
      }

      return newState;
    });
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

  setVariables = (path, variables) => {
    this.setState(prevState => {
      // Split the path into segments
      const pathSegments = path.split('.');

      // Build the nested update object
      let updateObject = { variables: {} };
      let current = updateObject.variables;

      // Build the nested structure
      pathSegments.forEach((segment, index) => {
        if (index === pathSegments.length - 1) {
          // Last segment - where we'll set the variables
          current[segment] = {
            $set: variables
          };
        } else {
          // Build the path to nested structures
          current[segment] = {};
          current = current[segment];
        }
      });

      return update(prevState, updateObject);
    });
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
