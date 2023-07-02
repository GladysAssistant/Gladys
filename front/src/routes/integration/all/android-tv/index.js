import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import AndroidTVPage from './AndroidTV';
import { RequestStatus } from '../../../../utils/consts';
import withIntlAsProp from '../../../../utils/withIntlAsProp';

class AndroidTVIntegration extends Component {
  componentWillMount() {
    this.props.getAndroidTVDevices();
    this.props.getHouses();
  }

  render(props, {}) {
    const loading = props.getAndroidTVStatus === RequestStatus.Getting;
    return <AndroidTVPage {...props} loading={loading} />;
  }
}

export default withIntlAsProp(connect('androidTVs,housesWithRooms,getAndroidTVStatus', actions)(AndroidTVIntegration));
