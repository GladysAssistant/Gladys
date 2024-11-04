import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import debounce from 'debounce';
import update from 'immutability-helper';
import ScenePage from './ScenePage';

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
      if (this.state.sceneTagSearch && this.state.sceneTagSearch.length) {
        params.searchTags = this.state.sceneTagSearch.join(',');
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
  getTags = async () => {
    try {
      const tags = await this.props.httpClient.get(`/api/v1/tag_scene`);
      this.setState({
        tags
      });
    } catch (e) {
      console.error(e);
    }
  };
  updateURL = () => {
    const { sceneSearch, sceneTagSearch } = this.state;
    const urlParams = new URLSearchParams();

    if (sceneSearch) urlParams.set('search', sceneSearch);
    if (sceneTagSearch.length > 0) {
      sceneTagSearch.forEach(tag => urlParams.append('tags', tag));
    }
    // Use `route` to update the URL without reloading the page
    route(`/dashboard/scene?${urlParams.toString()}`, true);
  };
  search = async e => {
    await this.setState({
      sceneSearch: e.target.value
    });
    this.updateURL();
    await this.getScenes();
  };
  searchTags = async tags => {
    await this.setState({
      sceneTagSearch: tags
    });
    this.updateURL();
    await this.getScenes();
  };

  changeOrderDir = async e => {
    await this.setState({
      getScenesOrderDir: e.target.value
    });
    await this.getScenes();
  };
  switchActiveScene = async sceneIndex => {
    this.setState({ saving: true });
    try {
      await this.setState(prevState => {
        const newState = update(prevState, {
          scenes: {
            [sceneIndex]: {
              active: {
                $set: !prevState.scenes[sceneIndex].active
              }
            }
          }
        });
        return newState;
      });
      const scene = this.state.scenes[sceneIndex];
      await this.props.httpClient.patch(`/api/v1/scene/${scene.selector}`, {
        active: scene.active
      });
    } catch (e) {
      console.error(e);
      // Rollback change if an error happened
      await this.setState(prevState => {
        const newState = update(prevState, {
          scenes: {
            [sceneIndex]: {
              active: {
                $set: !prevState.scenes[sceneIndex].active
              }
            }
          }
        });
        return newState;
      });
    }
    this.setState({ saving: false });
  };

  constructor(props) {
    super(props);
    this.props = props;
    // Initialize state from URL parameters if they exist
    const urlParams = new URLSearchParams(window.location.search);
    this.state = {
      getScenesOrderDir: 'asc',
      scenes: [],
      sceneSearch: urlParams.get('search') || '',
      sceneTagSearch: urlParams.getAll('tags') || [],
      loading: true
    };
    this.debouncedSearch = debounce(this.search.bind(this), 200);
  }

  componentWillMount() {
    this.getScenes();
    this.getTags();
  }

  render(props, { scenes, loading, getError, tags, sceneTagSearch, sceneSearch }) {
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
        tags={tags}
        searchTags={this.searchTags}
        sceneTagSearch={sceneTagSearch}
        sceneSearch={sceneSearch}
      />
    );
  }
}

export default connect('httpClient,currentUrl', {})(Scene);
