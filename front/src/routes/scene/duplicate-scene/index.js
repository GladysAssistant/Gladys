import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DuplicateScenePage from './DuplicateScenePage';
import { route } from 'preact-router';
import { RequestStatus } from '../../../utils/consts';
import get from 'get-value';

class DuplicateScene extends Component {
  goBack = async () => {
    route(`/dashboard/scene/${this.props.scene_selector}`);
  };

  getSourceScene = async () => {
    const scene = await this.props.httpClient.get(`/api/v1/scene/${this.props.scene_selector}`);
    this.setState({
      sourceScene: scene,
      loading: false,
      scene: {
        name: '',
        icon: scene.icon
      }
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
    if (!this.state.scene.icon) {
      duplicateSceneErrors.icon = true;
    }
    this.setState({
      duplicateSceneErrors
    });
    return Object.keys(duplicateSceneErrors).length > 0;
  };

  updateDuplicateSceneName = e => {
    this.setState({
      scene: {
        name: e.target.value,
        icon: this.state.scene.icon
      }
    });
    if (this.state.duplicateSceneErrors) {
      this.checkErrors();
    }
  };

  updateDuplicateSceneIcon = e => {
    this.setState({
      scene: {
        name: this.state.scene.name,
        icon: e.target.value
      }
    });
    if (this.state.duplicateSceneErrors) {
      this.checkErrors();
    }
  };

  constructor(props) {
    super(props);
    this.state = {
      scene: {
        name: '',
        icon: ''
      },
      sourceScene: {
        name: '',
        icon: ''
      },
      loading: true,
      duplicateSceneErrors: null,
      duplicateSceneStatus: null
    };
  }

  componentDidMount() {
    this.getSourceScene();
  }

  render(props, { duplicateSceneErrors, scene, duplicateSceneStatus, sourceScene, loading }) {
    return (
      <DuplicateScenePage
        {...props}
        goBack={this.goBack}
        scene={scene}
        loading={loading}
        sourceScene={sourceScene}
        updateDuplicateSceneName={this.updateDuplicateSceneName}
        updateDuplicateSceneIcon={this.updateDuplicateSceneIcon}
        duplicateScene={this.duplicateScene}
        duplicateSceneErrors={duplicateSceneErrors}
        duplicateSceneStatus={duplicateSceneStatus}
      />
    );
  }
}

export default connect('httpClient', {})(DuplicateScene);
