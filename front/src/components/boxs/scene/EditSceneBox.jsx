import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import update from 'immutability-helper';
import BaseEditBox from '../baseEditBox';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import { connect } from 'unistore/preact';
import Select from 'react-select';
import { RequestStatus } from '../../../utils/consts';
import { SceneListWithDragAndDrop } from '../../drag-and-drop/SceneListWithDragAndDrop';

class EditSceneBox extends Component {
  updateScenes = selectedSceneOptions => {
    selectedSceneOptions = selectedSceneOptions || [];
    const selectedScenes = selectedSceneOptions.map(option => option.value);
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      scenes: selectedScenes
    });
    this.setState({ selectedSceneOptions });
  };

  updateName = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      name: e.target.value
    });
  };

  updateCustomOrder = e => {
    const customOrder = e.target.checked;
    const newBoxConfig = {
      scene_custom_order: customOrder
    };
    if (customOrder) {
      // The currently displayed (alphabetical) order becomes
      // the starting point of the custom order.
      newBoxConfig.scenes = (this.state.selectedSceneOptions || []).map(option => option.value);
    }
    this.props.updateBoxConfig(this.props.x, this.props.y, newBoxConfig);
  };

  moveScene = (currentIndex, newIndex) => {
    const scenes = (this.state.selectedSceneOptions || []).map(option => option.value);
    const movedScene = scenes[currentIndex];
    const scenesWithoutMovedScene = update(scenes, {
      $splice: [[currentIndex, 1]]
    });
    const newScenes = update(scenesWithoutMovedScene, {
      $splice: [[newIndex, 0, movedScene]]
    });
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      scenes: newScenes
    });
  };

  getScenes = async () => {
    try {
      this.setState({ status: RequestStatus.Getting });
      const params = {
        order_dir: 'asc'
      };
      const sceneOptions = [];
      const scenes = await this.props.httpClient.get(`/api/v1/scene`, params);
      scenes.forEach(scene => {
        const sceneOption = {
          value: scene.selector,
          label: scene.name
        };
        sceneOptions.push(sceneOption);
      });

      await this.setState({
        sceneOptions,
        status: RequestStatus.Success
      });

      await this.refreshSelectedOptions(this.props);
    } catch (e) {
      this.setState({
        status: RequestStatus.Error
      });
    }
  };

  refreshSelectedOptions = async props => {
    const selectedSceneOptions = [];
    if (this.state.sceneOptions) {
      if (props.box.scene_custom_order && props.box.scenes) {
        // The scenes are displayed in the order chosen by the user
        props.box.scenes.forEach(sceneSelector => {
          const sceneOption = this.state.sceneOptions.find(option => option.value === sceneSelector);
          if (sceneOption) {
            selectedSceneOptions.push(sceneOption);
          }
        });
      } else {
        // By default, the scenes are displayed in alphabetical order
        this.state.sceneOptions.forEach(sceneOption => {
          if (props.box.scenes && props.box.scenes.indexOf(sceneOption.value) !== -1) {
            selectedSceneOptions.push(sceneOption);
          }
        });
      }
    }
    await this.setState({ selectedSceneOptions });
  };

  componentDidMount = () => {
    this.getScenes();
  };

  componentWillReceiveProps(nextProps) {
    const currentBox = this.props.box || {};
    const nextBox = nextProps.box || {};
    if (nextBox.scenes) {
      if (nextBox.scenes !== currentBox.scenes || nextBox.scene_custom_order !== currentBox.scene_custom_order) {
        this.refreshSelectedOptions(nextProps);
      }
    }
  }
  render(props, { status, selectedSceneOptions, sceneOptions }) {
    const loading = status === RequestStatus.Getting && !status;
    const displayScenesOrder = props.box.scene_custom_order && selectedSceneOptions && selectedSceneOptions.length > 0;
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.scene">
        <div class={loading ? 'dimmer active' : 'dimmer'}>
          <div class="loader" />
          <div class="dimmer-content">
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.scene.editNameLabel" />
              </label>
              <Localizer>
                <input
                  type="text"
                  className="form-control"
                  placeholder={<Text id="dashboard.boxes.scene.editNamePlaceholder" />}
                  value={props.box.name}
                  onInput={this.updateName}
                />
              </Localizer>
            </div>
            {sceneOptions && (
              <div class="form-group">
                <label>
                  <Text id="dashboard.boxes.scene.editSceneLabel" />
                </label>
                <Select
                  defaultValue={[]}
                  value={selectedSceneOptions}
                  options={sceneOptions}
                  isMulti
                  onChange={this.updateScenes}
                  maxMenuHeight={220}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>
            )}
            {sceneOptions && (
              <div class="form-group">
                <label class="custom-switch">
                  <input
                    type="checkbox"
                    class="custom-switch-input"
                    checked={props.box.scene_custom_order}
                    onChange={this.updateCustomOrder}
                  />
                  <span class="custom-switch-indicator" />
                  <span class="custom-switch-description">
                    <Text id="dashboard.boxes.scene.customOrderLabel" />
                  </span>
                </label>
                <small class="form-text text-muted">
                  <Text id="dashboard.boxes.scene.customOrderDescription" />
                </small>
              </div>
            )}
            {displayScenesOrder && (
              <div class="form-group">
                <label>
                  <Text id="dashboard.boxes.scene.orderSceneLabel" />
                </label>
                <SceneListWithDragAndDrop selectedSceneOptions={selectedSceneOptions} moveScene={this.moveScene} />
              </div>
            )}
          </div>
        </div>
      </BaseEditBox>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(EditSceneBox));
