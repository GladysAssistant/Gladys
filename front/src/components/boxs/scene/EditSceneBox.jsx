import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import { connect } from 'unistore/preact';
import Select from 'react-select';
import { RequestStatus } from '../../../utils/consts';

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
      this.state.sceneOptions.forEach(sceneOption => {
        if (props.box.scenes && props.box.scenes.indexOf(sceneOption.value) !== -1) {
          selectedSceneOptions.push(sceneOption);
        }
      });
    }
    await this.setState({ selectedSceneOptions });
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
  render(props, { status, selectedSceneOptions, sceneOptions }) {
    const loading = status === RequestStatus.Getting && !status;
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
