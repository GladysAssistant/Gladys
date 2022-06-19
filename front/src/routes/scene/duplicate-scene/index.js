import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DuplicateScenePage from './DuplicateScenePage';
import { route } from 'preact-router';
import { RequestStatus } from '../../../utils/consts';
import get from 'get-value';

@connect('httpClient', {})
class DuplicateScene extends Component {
  goBack = async () => {
    route(`/dashboard/scene/${this.props.scene_selector}`);
  };

  getSourceScene = () => {
    this.props.httpClient.get(`/api/v1/scene/${this.props.scene_selector}`).then(scene => {
      this.setState({
        sourceScene: scene
      });
    });
  };

  duplicateScene = async e => {
    e.preventDefault();
    // if errored, we don't continue
    if (this.checkErrors()) {
      return;
    }
    this.setState({
      duplicateSceneStatus: RequestStatus.Getting
    });
    try {
      const duplicatedScene = await this.props.httpClient.post(
        `/api/v1/scene/${this.props.scene_selector}/duplicate`,
        this.state.scene
      );
      this.setState({
        duplicateSceneStatus: RequestStatus.Success
      });
      route(`/dashboard/scene/${duplicatedScene.selector}`);
    } catch (e) {
      const status = get(e, 'response.status');
      if (status === 409) {
        this.setState({
          duplicateSceneStatus: RequestStatus.ConflictError
        });
      } else {
        this.setState({
          duplicateSceneStatus: RequestStatus.Error
        });
      }
    }
  };

  checkErrors = () => {
    let duplicateSceneErrors = {};
    if (!this.state.scene.name) {
      duplicateSceneErrors.name = true;
    }
    this.setState({
      duplicateSceneErrors
    });
    return Object.keys(duplicateSceneErrors).length > 0;
  };

  updateDuplicateSceneName = e => {
    this.setState({
      scene: {
        name: e.target.value
      }
    });
    if (this.state.duplicateSceneErrors) {
      this.checkErrors();
    }
  };

  constructor(props) {
    super(props);
    this.getSourceScene();
    this.state = {
      scene: {
        name: ''
      },
      sourceScene: {
        name: ''
      },
      duplicateSceneErrors: null,
      duplicateSceneStatus: null
    };
  }

  render(props, { duplicateSceneErrors, scene, duplicateSceneStatus, sourceScene }) {
    return (
      <DuplicateScenePage
        {...props}
        goBack={this.goBack}
        scene={scene}
        sourceScene={sourceScene}
        updateDuplicateSceneName={this.updateDuplicateSceneName}
        duplicateScene={this.duplicateScene}
        duplicateSceneErrors={duplicateSceneErrors}
        duplicateSceneStatus={duplicateSceneStatus}
      />
    );
  }
}

export default DuplicateScene;
