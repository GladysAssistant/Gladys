import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';
import Select from 'react-select';

const updateBoxScene = (updateBoxSceneFunc, x, y) => scene => {
  updateBoxSceneFunc(x, y, scene.selector);
};

@connect('', {})
class EditSceneBoxComponent extends Component {
  updateBoxScene = (x, y, scene) => {
    this.props.updateBoxConfig(x, y, {
      scene
    });
  };
  render(props, {}) {
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.scene">
        <div class="form-group">
          <label>
            <Text id="dashboard.boxes.scene.editSceneLabel" />
          </label>
          <SceneSelector
            selectedScene={props.box.scene}
            updateSceneSelection={updateBoxScene(this.updateBoxScene, props.x, props.y)}
          />
        </div>
      </BaseEditBox>
    );
  }
}

@connect('httpClient', {})
class SceneSelector extends Component {
  updateSelection = option => {
    this.props.updateSceneSelection(option.scene);
  };

  refreshOptions = () => {
    if (this.state.scenes) {
      let selectedScene;

      const scenesOptions = this.state.scenes.map(scene => {
        const option = {
          label: scene.name,
          value: scene.selector,
          scene
        };
        if (this.props.selectedScene === scene.selector) {
          selectedScene = option;
        }
        return option;
      });
      this.setState({ scenesOptions, selectedScene });
    }
  };

  getScenes = async () => {
    try {
      await this.setState({
        pending: true
      });
      const params = {
        order_dir: 'asc'
      };
      const scenes = await this.props.httpClient.get(`/api/v1/scene`, params);
      await this.setState({
        scenes,
        pending: false,
        error: false
      });
      this.refreshOptions();
    } catch (e) {
      this.setState({
        pending: false,
        error: true
      });
    }
  };

  componentDidMount = () => {
    this.getScenes();
  };

  componentWillReceiveProps() {
    this.refreshOptions();
  }

  render({}, { selectedScene, scenesOptions }) {
    return <Select value={selectedScene} options={scenesOptions} onChange={this.updateSelection} />;
  }
}

export default EditSceneBoxComponent;
