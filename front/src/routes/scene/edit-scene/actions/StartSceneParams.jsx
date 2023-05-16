import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';

import actions from '../../../../actions/scene';

class StartSceneParams extends Component {
  handleChange = selectedOption => {
    if (selectedOption) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'scene', selectedOption.value);
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'scene', null);
    }
  };

  refreshSelectedOptions = nextProps => {
    let selectedOption = null;
    let scenes = this.state.scenes || [];
    const currentScene = nextProps.scene.selector;

    if (scenes.length === 0 && nextProps.scenes) {
      scenes = nextProps.scenes
        .filter(scene => scene.selector !== currentScene)
        .map(scene => ({
          value: scene.selector,
          label: scene.name
        }));
    }

    if (nextProps.action.scene && scenes.length > 0) {
      selectedOption = scenes.find(scene => scene.value === nextProps.action.scene) || null;
    }

    this.setState({ selectedOption, scenes });
  };

  constructor(props) {
    super(props);
    this.state = {
      selectedOption: null
    };
  }

  async componentDidMount() {
    await this.props.getScenes();
  }

  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }

  render(props, { selectedOption, scenes }) {
    return (
      <div class="form-group">
        <div class="alert alert-info">
          <Text id="editScene.actionsCard.scene.notice" />
        </div>
        <label class="form-label">
          <Text id="editScene.actionsCard.scene.label" />
        </label>
        <Select value={selectedOption} onChange={this.handleChange} options={scenes} />
      </div>
    );
  }
}

export default connect('scenes', actions)(StartSceneParams);
