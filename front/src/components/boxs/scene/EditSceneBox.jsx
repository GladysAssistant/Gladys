import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import { connect } from 'unistore/preact';
import Select from 'react-select';
import update from 'immutability-helper';
import { RequestStatus } from '../../../utils/consts';
import { SceneListWithDragAndDrop } from '../../drag-and-drop/SceneListWithDragAndDrop';

class EditSceneBox extends Component {
  updateName = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      name: e.target.value
    });
  };

  refreshScenesConfig = selectedSceneOptions => {
    const selectedScenes = selectedSceneOptions.map(option => option.value);
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      scenes: selectedScenes
    });
  };

  addScene = async selectedSceneOption => {
    if (!selectedSceneOption) {
      return;
    }
    const newSelectedSceneOptions = [...this.state.selectedSceneOptions, selectedSceneOption];
    await this.setState({ selectedSceneOptions: newSelectedSceneOptions });
    this.refreshScenesConfig(newSelectedSceneOptions);
  };

  moveScene = async (currentIndex, newIndex) => {
    const element = this.state.selectedSceneOptions[currentIndex];

    const newStateWithoutElement = update(this.state, {
      selectedSceneOptions: {
        $splice: [[currentIndex, 1]]
      }
    });
    const newState = update(newStateWithoutElement, {
      selectedSceneOptions: {
        $splice: [[newIndex, 0, element]]
      }
    });
    await this.setState(newState);
    this.refreshScenesConfig(newState.selectedSceneOptions);
  };

  removeScene = async index => {
    const newStateWithoutElement = update(this.state, {
      selectedSceneOptions: {
        $splice: [[index, 1]]
      }
    });
    await this.setState(newStateWithoutElement);
    this.refreshScenesConfig(newStateWithoutElement.selectedSceneOptions);
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
    if (this.state.sceneOptions && props.box.scenes) {
      props.box.scenes.forEach(sceneSelector => {
        const sceneOption = this.state.sceneOptions.find(option => option.value === sceneSelector);
        if (sceneOption) {
          selectedSceneOptions.push(sceneOption);
        }
      });
    }
    await this.setState({ selectedSceneOptions });
  };

  getAvailableSceneOptions = () => {
    const selectedSceneValues = (this.state.selectedSceneOptions || []).map(option => option.value);
    return (this.state.sceneOptions || []).filter(option => !selectedSceneValues.includes(option.value));
  };

  componentDidMount = () => {
    this.getScenes();
  };

  componentWillReceiveProps(nextProps) {
    if (nextProps.box && nextProps.box.scenes) {
      if (!this.props.box || !this.props.box.scenes || nextProps.box.scenes !== this.props.box.scenes) {
        this.refreshSelectedOptions(nextProps);
      }
    }
  }

  render(props, { status, selectedSceneOptions }) {
    const loading = status === RequestStatus.Getting && !status;
    const availableSceneOptions = this.getAvailableSceneOptions();

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
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.scene.editSceneLabel" />
              </label>
              {selectedSceneOptions && (
                <SceneListWithDragAndDrop
                  selectedSceneOptions={selectedSceneOptions}
                  moveScene={this.moveScene}
                  removeScene={this.removeScene}
                  isTouchDevice={false}
                />
              )}
            </div>
            {availableSceneOptions.length > 0 && (
              <div class="form-group">
                <label>
                  <Text id="dashboard.boxes.scene.addSceneLabel" />
                </label>
                <Select
                  onChange={this.addScene}
                  value={[]}
                  options={availableSceneOptions}
                  maxMenuHeight={220}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>
            )}
          </div>
        </div>
      </BaseEditBox>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(EditSceneBox));
