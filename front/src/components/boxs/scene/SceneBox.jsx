import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import actions from '../../../actions/dashboard/boxes/scene';
import { DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY } from '../../../utils/consts';
import get from 'get-value';
import dayjs from 'dayjs';

const isNotNullOrUndefined = value => value !== undefined && value !== null;

const SceneBox = ({ children, ...props }) => (
  <div class="card p-3">
    <div class="d-flex align-items-center list-separated">
      <div class=" mr-3 col-auto">
        <i className={`fe fe-${props.icon}`} />
      </div>
      <div class="col">
        <h4 class="m-0">{props.name}</h4>
        {isNotNullOrUndefined(props.lastExecuted) && (
          <small className="m-0">
            <Text
              id="dashboard.boxes.scene.lastExecution"
              fields={{
                dateLastExecution: dayjs(props.lastExecuted)
                  .locale(props.user.language)
                  .fromNow()
              }}
            />
          </small>
        )}
      </div>
      <div class="col-auto">
        <div>
          <label className="custom-switch m-0" style={{ display: 'flex' }}>
            <input
              type="checkbox"
              name="active"
              value="1"
              className="custom-switch-input"
              checked={props.active}
              onClick={props.switchActiveScene}
            />
            <span className="custom-switch-indicator" />
          </label>
        </div>
      </div>
    </div>
  </div>
);

class SceneBoxComponent extends Component {
  refreshData = () => {
    this.props.getScene(this.props.box, this.props.x, this.props.y);
  };

  switchActiveScene = () => {
    const boxData = get(this.props, `${DASHBOARD_BOX_DATA_KEY}Scene.${this.props.x}_${this.props.y}`);
    const active = get(boxData, 'scene.active');
    this.props.switchActiveScene(this.props.box, this.props.x, this.props.y, !active);
  };

  componentDidMount() {
    this.refreshData();
  }

  componentDidUpdate(previousProps) {
    const sceneChanged = get(previousProps, 'box.scene') !== get(this.props, 'box.scene');
    if (sceneChanged) {
      this.refreshData();
    }
  }

  render(props, {}) {
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}Scene.${props.x}_${props.y}`);
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}Scene.${props.x}_${props.y}`);
    const active = get(boxData, 'scene.active');
    const lastExecuted = get(boxData, 'scene.last_executed');
    const icon = get(boxData, 'scene.icon');
    const name = get(boxData, 'scene.name');
    return (
      <SceneBox
        {...props}
        icon={icon}
        lastExecuted={lastExecuted}
        active={active}
        boxStatus={boxStatus}
        name={name}
        switchActiveScene={this.switchActiveScene}
      />
    );
  }
}

export default connect('DashboardBoxDataScene,DashboardBoxStatusScene,user', actions)(SceneBoxComponent);
