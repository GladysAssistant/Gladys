import { Component } from 'preact';
import { connect } from 'unistore/preact';
import EditScenePage from './EditScenePage';
import actions from '../../../actions/scene';

@connect(
  'session,sceneParamsData,scene,highLightedActions',
  actions
)
class EditScene extends Component {
  startScene = () => {
    this.props.startScene(this.props.scene_selector);
  };
  deleteScene = () => {
    this.props.deleteScene(this.props.scene_selector);
  };
  componentWillMount() {
    this.props.getSceneBySelector(this.props.scene_selector);
    this.props.getUsers();
    this.props.session.dispatcher.addListener('scene.executing-action', payload =>
      this.props.highlighCurrentlyExecutedAction(payload)
    );
    this.props.session.dispatcher.addListener('scene.finished-executing-action', payload =>
      this.props.removeHighlighAction(payload)
    );
  }

  render(props, {}) {
    return props.scene && <EditScenePage {...props} startScene={this.startScene} deleteScene={this.deleteScene} />;
  }
}

export default EditScene;
