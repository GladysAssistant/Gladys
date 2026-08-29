import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import CinemaPage from './Cinema';
import { RequestStatus } from '../../../../utils/consts';

class CinemaIntegration extends Component {
  componentWillMount() {
    this.props.getApiKey();
  }

  render(props, {}) {
    const loading =
      props.cinemaSaveApiKeyStatus === RequestStatus.Getting || props.cinemaGetApiKeyStatus === RequestStatus.Getting;
    const error =
      props.cinemaSaveApiKeyStatus === RequestStatus.Error || props.cinemaGetApiKeyStatus === RequestStatus.Error;
    return <CinemaPage {...props} loading={loading} error={error} />;
  }
}

export default connect('user,tmdbApiKey,cinemaSaveApiKeyStatus,cinemaGetApiKeyStatus', actions)(CinemaIntegration);
