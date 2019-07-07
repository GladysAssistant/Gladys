import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import DarkSkyPage from './DarkSky';
import { RequestStatus } from '../../../../utils/consts';

@connect(
  'user,darkSkyApiKey,darkskySaveConfigStatus,darkskyGetConfigStatus',
  actions
)
class DarkSkyIntegration extends Component {
  componentWillMount() {
    this.props.getConfig();
  }

  render(props, {}) {
    const loading =
      props.darkskySaveConfigStatus === RequestStatus.Getting || props.darkskyGetConfigStatus === RequestStatus.Getting;
    return <DarkSkyPage {...props} loading={loading} />;
  }
}

export default DarkSkyIntegration;
