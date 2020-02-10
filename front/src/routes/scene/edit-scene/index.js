import { Component } from 'preact';
import { connect } from 'unistore/preact';
import EditScenePage from './EditScenePage';
import actions from '../../../actions/scene';

@connect('session,sceneParamsData,scene,highLightedActions', actions)
class EditScene extends Component {
  startScene = () => {
    this.props.startScene(this.props.scene_selector);
  };
  saveScene = async () => {
    this.setState({ saving: true });
    await this.props.saveScene();
    this.setState({ saving: false });
  };
  deleteScene = () => {
    this.setState({ saving: true });
    this.props.deleteScene(this.props.scene_selector);
    this.setState({ saving: false });
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

  render(props, { saving }) {
    return (
      props.scene && (
        <EditScenePage
          {...props}
          startScene={this.startScene}
          deleteScene={this.deleteScene}
          saveScene={this.saveScene}
          saving={saving}
        />
      )
    );
  }
}

export default EditScene;
