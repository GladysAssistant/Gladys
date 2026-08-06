import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { RequestStatus } from '../../../utils/consts';
import SceneRow from './SceneRow';
import cx from 'classnames';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
import { computeRunningInfo, mergeRunningScenes } from '../../../routes/scene/runningInfo';

class SceneBoxComponent extends Component {
  refreshData = () => {
    this.getScene();
  };

  getScene = async () => {
    this.setState({ status: RequestStatus.Getting });
    try {
      const scenes = await this.props.httpClient.get(`/api/v1/scene`, {
        selectors: this.props.box.scenes.join(',')
      });
      this.setState({
        scenes,
        status: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        status: RequestStatus.Error
      });
    }
  };

  getRunningScenes = async () => {
    try {
      const runningScenes = await this.props.httpClient.get('/api/v1/scene/running');
      // Merge with any websocket-driven updates received while fetching
      this.setState(prevState => ({ runningScenes: mergeRunningScenes(runningScenes, prevState.runningScenes) }));
    } catch (e) {
      console.error(e);
    }
  };
  onSceneStarted = payload => {
    this.setState(prevState => {
      const alreadyKnown = (prevState.runningScenes || []).some(scene => scene.executionId === payload.executionId);
      if (alreadyKnown) {
        return null;
      }
      return { runningScenes: [...(prevState.runningScenes || []), payload] };
    });
  };
  onSceneStopped = payload => {
    this.setState(prevState => ({
      runningScenes: (prevState.runningScenes || []).filter(scene => scene.executionId !== payload.executionId)
    }));
  };
  // Keep a 1s ticker running only while at least one scene is executing,
  // so running rows can display a live elapsed time.
  refreshTicker = () => {
    const hasRunning = (this.state.runningScenes || []).length > 0;
    if (hasRunning && !this.ticker) {
      this.ticker = setInterval(() => this.setState({ now: Date.now() }), 1000);
    } else if (!hasRunning && this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  };

  constructor(props) {
    super(props);
    this.state = {
      runningScenes: [],
      now: Date.now()
    };
    this.ticker = null;
  }

  componentDidMount() {
    this.refreshData();
    this.getRunningScenes();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.SCENE.STARTED, this.onSceneStarted);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.SCENE.STOPPED, this.onSceneStopped);
  }

  componentDidUpdate() {
    // Start/stop the ticker based on the applied state.
    this.refreshTicker();
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.SCENE.STARTED, this.onSceneStarted);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.SCENE.STOPPED, this.onSceneStopped);
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.box.scenes !== this.props.box.scenes) {
      this.refreshData();
    }
  }

  render(props, { scenes, status, runningScenes, now }) {
    const boxTitle = props.box.name;
    const loading = status === RequestStatus.Getting && !status;

    return (
      <div class="card">
        {boxTitle && (
          <div class="card-header">
            <h3 class="card-title">{boxTitle}</h3>
          </div>
        )}
        <div
          class={cx('dimmer', {
            active: loading
          })}
        >
          <div class="loader py-3" />
          <div class="dimmer-content">
            <div class="table-responsive">
              <table className="table card-table table-vcenter">
                <tbody>
                  {scenes &&
                    scenes.map(scene => (
                      <SceneRow
                        key={scene.selector}
                        boxStatus={status}
                        name={scene.name}
                        icon={scene.icon}
                        user={props.user}
                        sceneSelector={scene.selector}
                        runningInfo={computeRunningInfo(runningScenes, scene.selector, now)}
                      />
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('user,httpClient,session', {})(SceneBoxComponent);
