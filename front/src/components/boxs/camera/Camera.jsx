import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import actions from '../../../actions/dashboard/boxes/camera';
import { DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY, RequestStatus } from '../../../utils/consts';
import get from 'get-value';

const CameraBox = ({ children, ...props }) => (
  <div class="card">
    {props.image && <img class="card-img-top" src={`data:${props.image}`} alt={props.roomName} />}
    {!props.image && props.boxStatus !== RequestStatus.Getting && (
      <div>
        <p class="alert alert-danger">
          <i class="fe fe-bell" />
          <span class="pl-2">
            <Text id="dashboard.boxes.camera.noImageToShow" />
          </span>
        </p>
      </div>
    )}
    <div class="card-body d-flex flex-column">
      {props.boxStatus === RequestStatus.Getting && (
        <div class="dimmer active">
          <div class="dimmer-content" style={{ height: '100px' }} />
          <div class="loader" />
        </div>
      )}
      <h4>{props.box && props.box.name}</h4>
    </div>
  </div>
);

@connect(
  'DashboardBoxDataCamera,DashboardBoxStatusCamera',
  actions
)
class CameraBoxComponent extends Component {
  componentDidMount() {
    this.props.getCameraImage(this.props.box, this.props.x, this.props.y);
  }

  render(props, {}) {
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}Camera.${props.x}_${props.y}`);
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}Camera.${props.x}_${props.y}`);
    const image = get(boxData, 'image');
    return <CameraBox {...props} image={image} boxStatus={boxStatus} />;
  }
}

export default CameraBoxComponent;
