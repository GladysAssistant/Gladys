import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import WithingsPage from '../WithingsPage';
import WithingsDevices from './WithingsDevices';
import { RequestStatus } from '../../../../../utils/consts';

class WithingsDevicePage extends Component {
  componentWillMount() {
    this.props.getWithingsDevice();
    this.props.getHouses();
  }

  render(props, {}) {
    const loading = props.withingsGetStatus === RequestStatus.Getting;
    return (
      <WithingsPage user={props.user} {...props} loading={loading}>
        <WithingsDevices user={props.user} {...props} />
      </WithingsPage>
    );
  }
}

export default connect(
  'user,session,houses,withingsClientId,withingsSaveStatus,withingsGetStatus,withingsImgMap,withingsDevices',
  actions
)(WithingsDevicePage);
