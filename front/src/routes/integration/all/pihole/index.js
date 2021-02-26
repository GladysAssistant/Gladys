import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import PiholePage from './Pihole';
import { RequestStatus } from '../../../../utils/consts';

@connect('user,piholeIp,piholeGetIpStatus,piholeSaveIpStatus', actions)
class PiholeIntegration extends Component {
  componentWillMount() {
    this.props.getPiholeIp();
  }

  render(props, {}) {
    const loading =
      props.piholeGetIpStatus === RequestStatus.Getting || props.piholeSaveIpStatus === RequestStatus.Getting;
    return <PiholePage {...props} loading={loading} />;
  }
}

export default PiholeIntegration;
