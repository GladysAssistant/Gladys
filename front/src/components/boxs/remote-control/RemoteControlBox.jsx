import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import actions from '../../../actions/dashboard/boxes/remoteControl';
import RemoteControlLayout from '../../remote-control/RemoteControlLayout';
import { DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY, RequestStatus } from '../../../utils/consts';

@connect('DashboardBoxDataRemote,DashboardBoxStatusRemote', actions)
class RemoteControlBoxComponent extends Component {
  setValue = (featureName, value) => {
    const boxData = get(this.props, `${DASHBOARD_BOX_DATA_KEY}Remote.${this.props.x}_${this.props.y}`);
    const feature = boxData.device.features.find(f => f.type === featureName);

    if (feature) {
      this.props.setValue(feature.selector, value === undefined ? 0 : value);
    }
  };

  componentDidMount() {
    this.props.getRemoteControl(this.props.box, this.props.x, this.props.y);
  }

  render(props) {
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}Remote.${props.x}_${props.y}`);
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}Remote.${props.x}_${props.y}`);
    const error = boxStatus === RequestStatus.Error;

    if (error || !boxData) {
      return null;
    }

    const { device } = boxData;
    const featureByType = {};
    device.features.map(feature => {
      featureByType[feature.type] = feature;
    });

    return (
      <RemoteControlLayout
        loading={boxStatus === RequestStatus.Getting}
        editionMode={false}
        remoteType={props.box.remote}
        onClick={this.setValue}
        remoteName={device.name}
        featureByType={featureByType}
        dashboard
      />
    );
  }
}

export default RemoteControlBoxComponent;
