import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import actions from '../../../actions/dashboard/boxes/remoteControl';
import RemoteControlLayout from '../../remote-control/RemoteControlLayout';
import { DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY, RequestStatus } from '../../../utils/consts';

@connect('DashboardBoxDataRemote,DashboardBoxStatusRemote', actions)
class RemoteControlBoxComponent extends Component {
  setValue(featureName) {
    const boxData = get(this.props, `${DASHBOARD_BOX_DATA_KEY}Remote.${this.props.x}_${this.props.y}`);
    const feature = boxData.remote.features.find(f => f.type === featureName);

    if (feature) {
      this.props.setValue(feature.selector, 0);
    }
  }

  constructor(props) {
    super(props);

    this.setValue = this.setValue.bind(this);
  }

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

    const { remote } = boxData;
    let remoteName;
    let featureByType;
    if (remote) {
      remoteName = remote.name;
      featureByType = {};
      remote.features.map(feature => {
        featureByType[feature.type] = feature;
      });
    }

    return (
      <RemoteControlLayout
        {...props}
        loading={boxStatus === RequestStatus.Getting}
        editionMode={false}
        remoteType={props.box.remoteType}
        onClick={this.setValue}
        remoteName={remoteName}
        featureByType={featureByType}
        dashboard
      />
    );
  }
}

export default RemoteControlBoxComponent;
