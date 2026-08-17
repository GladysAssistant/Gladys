import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';

import { ACTIONS } from '../../../../../../server/utils/constants';
import actions from '../../../../actions/scene';

class EnableDisableSceneParams extends Component {
  handleChange = selectedOption => {
    if (selectedOption) {
      this.props.updateActionProperty(this.props.path, 'scene', selectedOption.value);
    } else {
      this.props.updateActionProperty(this.props.path, 'scene', null);
    }
  };

  refreshSelectedOptions = nextProps => {
    let selectedOption = null;
    let scenes = this.state.scenes || [];

    // Contrary to the "start a scene" action, the current scene is part of the list:
    // a scene disabling itself is the way to build a "run once, then disarm" scene.
    if (scenes.length === 0 && nextProps.scenes) {
      scenes = nextProps.scenes.map(scene => ({
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
    const enabling = props.action.type === ACTIONS.SCENE.ENABLE;
    return (
      <div class="form-group">
        <div class="alert alert-info">
          {enabling && <Text id="editScene.actionsCard.setSceneActive.enableNotice" />}
          {!enabling && <Text id="editScene.actionsCard.setSceneActive.disableNotice" />}
        </div>
        <label class="form-label">
          <Text id="editScene.actionsCard.setSceneActive.label" />
        </label>
        <Select
          value={selectedOption}
          onChange={this.handleChange}
          options={scenes}
          className="react-select-container"
          classNamePrefix="react-select"
        />
      </div>
    );
  }
}

export default connect('scenes', actions)(EnableDisableSceneParams);
