import { Component } from 'preact';
import { connect } from 'unistore/preact';
import debounce from 'debounce';
import update from 'immutability-helper';
import ScenePage from './ScenePage';

@connect('httpClient,currentUrl', {})
class Scene extends Component {
  getScenes = async () => {
    this.setState({
      loading: true,
      getError: false
    });
    try {
      const orderDir = this.state.getScenesOrderDir;
      const params = {
        order_dir: orderDir
      };
      if (this.state.sceneSearch && this.state.sceneSearch.length) {
        params.search = this.state.sceneSearch;
      }
      const scenes = await this.props.httpClient.get('/api/v1/scene', params);
      this.setState({
        scenes,
        loading: false,
        getError: false
      });
    } catch (e) {
      this.setState({
        loading: false,
        getError: true
      });
    }
  };
  search = async e => {
    await this.setState({
      sceneSearch: e.target.value
    });
    await this.getScenes();
  };
  changeOrderDir = async e => {
    await this.setState({
      getScenesOrderDir: e.target.value
    });
    await this.getScenes();
  };
  switchActiveScene = async sceneIndex => {
    await this.setActive(sceneIndex, !this.state.scenes[sceneIndex].active);
  };
  setActive = async (sceneIndex, value) => {
    this.setState({ saving: true });
    try {
      const scene = this.state.scenes[sceneIndex];
      const updateScene = await this.props.httpClient.patch(`/api/v1/scene/${scene.selector}`, {
        active: value
      });
      this.setState(prevState => {
        const newState = update(prevState, {
          scenes: {
            [sceneIndex]: {
              active: {
                $set: updateScene.active
              }
            }
          }
        });
        return newState;
      });
    } catch (e) {
      console.error(e);
    }
    this.setState({ saving: false });
  };

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      getScenesOrderDir: 'asc',
      scenes: [],
      sceneSearch: null,
      loading: true
    };
    this.debouncedSearch = debounce(this.search.bind(this), 200);
  }

  componentWillMount() {
    this.getScenes();
  }

  render(props, { scenes, loading, getError }) {
    return (
      <ScenePage
        httpClient={props.httpClient}
        currentUrl={props.currentUrl}
        scenes={scenes}
        getError={getError}
        loading={loading}
        debouncedSearch={this.debouncedSearch}
        changeOrderDir={this.changeOrderDir}
        switchActiveScene={this.switchActiveScene}
      />
    );
  }
}

export default Scene;
