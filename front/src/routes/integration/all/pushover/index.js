import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import PushoverPage from './Pushover';
import { RequestStatus } from '../../../../utils/consts';

@connect(
  'user,pushoverApiKey,pushoverUserKey,pushoverGetApiKeyStatus,pushoverSaveApiKeyStatus,pushoverGetUserKeyStatus,pushoverSaveUserKeyStatus',
  actions
)
class PushoverIntegration extends Component {
  componentWillMount() {
    this.props.getPushoverKeys();
  }

  render(props, {}) {
    const loading =
      props.pushoverGetApiKeyStatus === RequestStatus.Getting ||
      props.pushoverSaveApiKeyStatus === RequestStatus.Getting;

    return <PushoverPage {...props} loading={loading} />;
  }
}

export default PushoverIntegration;
