import { Component } from 'preact';
import { connect } from 'unistore/preact';
import update from 'immutability-helper';
import { route } from 'preact-router';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { RequestStatus } from '../../../utils/consts';
import EditScenePage from './EditScenePage';

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
      this.setState({ isNameEditable: false, isDescriptionEditable: false });
    } catch (e) {
      console.error(e);
      this.setState({ error: true });
    }
    this.setState({ saving: false });
  };
  addAction = columnIndex => {
    this.setState(prevState => {
      let newState = update(prevState, {
        scene: {
          actions: {
            [columnIndex]: {
              $push: [
                {
                  type: null
                }
              ]
            }
          }
        },
        variables: {
          [columnIndex]: {
            $push: [[]]
          }
        }
      });
      if (columnIndex + 1 === newState.scene.actions.length && newState.scene.actions[columnIndex].length === 1) {
        newState = update(newState, {
          scene: {
            actions: {
              $push: [[]]
            }
          },
          variables: {
            $push: [[]]
          }
        });
      }
      return newState;
    });
  };
  deleteActionGroup = columnIndex => {
    let newState = update(this.state, {
      scene: {
        actions: {
          $splice: [[columnIndex, 1]]
        }
      },
      variables: {
        $splice: [[columnIndex, 1]]
      }
    });
    this.setState(newState);
  };

  deleteAction = (columnIndex, rowIndex) => {
    this.setState(prevState => {
      let newState = update(prevState, {
        scene: {
          actions: {
            [columnIndex]: {
              $splice: [[rowIndex, 1]]
            }
          }
        },
        variables: {
          [columnIndex]: {
            $splice: [[rowIndex, 1]]
          }
        }
      });
      // if necessary, we remove the last action group
      if (newState.scene.actions.length >= 2) {
        if (
          newState.scene.actions[newState.scene.actions.length - 1].length === 0 &&
          newState.scene.actions[newState.scene.actions.length - 2].length === 0
        ) {
          newState = update(newState, {
            scene: {
              actions: {
                $splice: [[newState.scene.actions.length - 1, 1]]
              }
            },
            variables: {
              $splice: [[newState.scene.actions.length - 1, 1]]
            }
          });
        }
      }

      return newState;
    });
  };
  updateActionProperty = (columnIndex, rowIndex, property, value) => {
    this.setState(prevState => {
      const newState = update(prevState, {
        scene: {
          actions: {
            [columnIndex]: {
              [rowIndex]: {
                [property]: {
                  $set: value
                }
              }
            }
          }
        }
      });
      return newState;
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

  setVariables = (columnIndex, index, variables) => {
    this.setState(prevState => {
      const newState = update(prevState, {
        variables: {
          [columnIndex]: {
            [index]: {
              $set: variables
            }
          }
        }
      });
      return newState;
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

  toggleIsNameEditable = async () => {
    await this.setState(prevState => ({ isNameEditable: !prevState.isNameEditable, isDescriptionEditable: false }));
    if (this.state.isNameEditable) {
      this.nameInput.focus();
    }
  };

  setNameInputRef = nameInput => {
    this.nameInput = nameInput;
  };

  toggleIsDescriptionEditable = async () => {
    await this.setState(prevState => ({
      isDescriptionEditable: !prevState.isDescriptionEditable,
      isNameEditable: false
    }));
    if (this.state.isDescriptionEditable) {
      this.descriptionInput.focus();
    }
  };

  closeEdition = () => {
    this.setState({ isNameEditable: false, isDescriptionEditable: false });
  };

  setDescriptionInputRef = descriptionInput => {
    this.descriptionInput = descriptionInput;
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

  duplicateScene = () => {
    route(`/dashboard/scene/${this.props.scene_selector}/duplicate`);
  };
  moveCard = async (originalX, originalY, destX, destY) => {
    // incorrect coordinates
    if (destX < 0 || destY < 0) {
      return null;
    }

    if (destY >= this.state.scene.actions.length || destX > this.state.scene.actions[destY].length) {
      return null;
    }
    const element = this.state.scene.actions[originalY][originalX];
    const variable = this.state.variables[originalY][originalX];
    const newStateWithoutElement = update(this.state, {
      scene: {
        actions: {
          [originalY]: {
            $splice: [[originalX, 1]]
          }
        }
      },
      variables: {
        [originalY]: {
          $splice: [[originalX, 1]]
        }
      }
    });
    const newState = update(newStateWithoutElement, {
      scene: {
        actions: {
          [destY]: {
            $splice: [[destX, 0, element]]
          }
        }
      },
      variables: {
        [destY]: {
          $splice: [[destX, 0, variable]]
        }
      }
    });
    await this.setState(newState);
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
  };

  constructor(props) {
    super(props);
    this.state = {
      scene: null,
      variables: {},
      triggersVariables: [],
      isNameEditable: false
    };
  }

  componentDidMount() {
    document.addEventListener('click', this.closeEdition, true);
    this.getSceneBySelector();
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

  render(props, { saving, error, variables, scene, isNameEditable, isDescriptionEditable, triggersVariables }) {
    return (
      scene && (
        <DndProvider backend={this.isTouchDevice ? TouchBackend : HTML5Backend}>
          <EditScenePage
            {...props}
            scene={scene}
            startScene={this.startScene}
            deleteScene={this.deleteScene}
            saveScene={this.saveScene}
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
            toggleIsNameEditable={this.toggleIsNameEditable}
            isNameEditable={isNameEditable}
            updateSceneName={this.updateSceneName}
            setNameInputRef={this.setNameInputRef}
            duplicateScene={this.duplicateScene}
            moveCard={this.moveCard}
            moveCardGroup={this.moveCardGroup}
            updateSceneDescription={this.updateSceneDescription}
            toggleIsDescriptionEditable={this.toggleIsDescriptionEditable}
            isDescriptionEditable={isDescriptionEditable}
            setDescriptionInputRef={this.setDescriptionInputRef}
          />
        </DndProvider>
      )
    );
  }
}

export default connect('session,httpClient', {})(EditScene);
