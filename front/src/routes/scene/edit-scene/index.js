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
    this.setState({ saving: true, error: false });
    try {
      await this.props.saveScene();
    } catch (e) {
      console.log(e);
      this.setState({ error: true });
    }
    this.setState({ saving: false });
  };
  deleteScene = () => {
    this.setState({ saving: true });
    this.props.deleteScene(this.props.scene_selector);
    this.setState({ saving: false });
  };

  componentDidMount() {
    this.props.getSceneBySelector(this.props.scene_selector);
    this.props.getUsers();
    this.props.session.dispatcher.addListener('scene.executing-action', payload =>
      this.props.highlighCurrentlyExecutedAction(payload)
    );
    this.props.session.dispatcher.addListener('scene.finished-executing-action', payload =>
      this.props.removeHighlighAction(payload)
    );
  }

  render(props, { saving, error }) {
    return (
      props.scene && (
        <EditScenePage
          {...props}
          startScene={this.startScene}
          deleteScene={this.deleteScene}
          saveScene={this.saveScene}
          saving={saving}
          error={error}
        />
      )
    );
  }
}

export default EditScene;
