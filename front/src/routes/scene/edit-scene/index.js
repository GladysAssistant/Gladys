import { Component } from 'preact';
import { connect } from 'unistore/preact';
import update from 'immutability-helper';
import { route } from 'preact-router';

import { RequestStatus } from '../../../utils/consts';
import EditScenePage from './EditScenePage';

@connect('session,httpClient', {})
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
        variables.push(actionGroup.map(action => []));
      });
      this.setState({
        scene,
        variables,
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
  saveScene = async () => {
    this.setState({ saving: true, error: false });
    try {
      await this.props.httpClient.patch(`/api/v1/scene/${this.props.scene_selector}`, this.state.scene);
    } catch (e) {
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

  constructor(props) {
    super(props);
    this.state = {
      scene: null,
      variables: {}
    };
  }

  componentDidMount() {
    this.getSceneBySelector();
    this.props.session.dispatcher.addListener('scene.executing-action', payload =>
      this.highlighCurrentlyExecutedAction(payload)
    );
    this.props.session.dispatcher.addListener('scene.finished-executing-action', payload =>
      this.removeHighlighAction(payload)
    );
  }

  render(props, { saving, error, variables, scene }) {
    return (
      scene && (
        <EditScenePage
          {...props}
          scene={scene}
          startScene={this.startScene}
          deleteScene={this.deleteScene}
          saveScene={this.saveScene}
          updateActionProperty={this.updateActionProperty}
          updateTriggerProperty={this.updateTriggerProperty}
          addAction={this.addAction}
          deleteAction={this.deleteAction}
          addTrigger={this.addTrigger}
          deleteTrigger={this.deleteTrigger}
          saving={saving}
          error={error}
          variables={variables}
          setVariables={this.setVariables}
        />
      )
    );
  }
}

export default EditScene;
