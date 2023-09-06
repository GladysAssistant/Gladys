import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { RequestStatus } from '../../../utils/consts';
import SceneRow from './SceneRow';
import cx from 'classnames';

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

  componentDidMount() {
    this.refreshData();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.box.scenes !== this.props.box.scenes) {
      this.refreshData();
    }
  }

  render(props, { scenes, status }) {
    const boxTitle = props.box.name;
    const loading = status === RequestStatus.Getting && !status;

    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{boxTitle}</h3>
        </div>

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
                        boxStatus={status}
                        name={scene.name}
                        icon={scene.icon}
                        user={props.user}
                        sceneSelector={scene.selector}
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

export default connect('user,httpClient', {})(SceneBoxComponent);
