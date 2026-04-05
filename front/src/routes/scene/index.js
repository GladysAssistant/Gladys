import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import debounce from 'debounce';
import update from 'immutability-helper';
import ScenePage from './ScenePage';

class Scene extends Component {
  getUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search);

    const sceneSearch = urlParams.get('search');
    const sceneTagSearch = urlParams.getAll('tags');
    const orderDir = urlParams.get('order_dir');

    return { sceneSearch, sceneTagSearch, orderDir };
  };
  getScenes = async () => {
    this.setState({
      loading: true,
      getError: false
    });
    try {
      const params = {};

      const { sceneSearch, sceneTagSearch, orderDir } = this.getUrlParams();

      if (sceneSearch && sceneSearch.length) {
        params.search = sceneSearch;
      }
      if (sceneTagSearch && sceneTagSearch.length) {
        params.searchTags = sceneTagSearch.join(',');
      }
      if (orderDir) {
        params.order_dir = orderDir;
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
  updateURL = ({ sceneSearch, sceneTagSearch, orderDir }) => {
    const urlParams = new URLSearchParams();

    // If we are updating the search
    if (sceneSearch) {
      urlParams.set('search', sceneSearch);
    }

    // If we are updating the order dir
    if (orderDir) {
      urlParams.set('order_dir', orderDir);
    }

    // If we are updating the tags
    if (sceneTagSearch && sceneTagSearch.length > 0) {
      sceneTagSearch.forEach(tag => urlParams.append('tags', tag));
    }

    if (urlParams.toString()) {
      route(`/dashboard/scene?${urlParams.toString()}`, true);
    } else {
      route(`/dashboard/scene`, true);
    }
  };
  search = async e => {
    this.updateURL({
      sceneSearch: e.target.value
    });
    await this.debouncedGetScenes();
  };
  searchTags = async tags => {
    this.updateURL({
      sceneTagSearch: tags
    });
    await this.getScenes();
  };

  changeOrderDir = async e => {
    this.updateURL({
      orderDir: e.target.value
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
    this.state = {
      scenes: [],
      loading: true
    };
    this.debouncedGetScenes = debounce(this.getScenes.bind(this), 200);
  }

  componentWillMount() {
    this.getScenes();
    this.getTags();
  }

  render(props, { scenes, loading, getError, tags }) {
    const { sceneSearch, sceneTagSearch, orderDir } = this.getUrlParams();
    return (
      <ScenePage
        httpClient={props.httpClient}
        currentUrl={props.currentUrl}
        scenes={scenes}
        getError={getError}
        loading={loading}
        search={this.search}
        orderDir={orderDir}
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
