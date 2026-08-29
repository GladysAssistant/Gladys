import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import TmdbPage from './Tmdb';
import { RequestStatus } from '../../../../utils/consts';

class TmdbIntegration extends Component {
  componentWillMount() {
    this.props.getApiKey();
  }

  render(props, {}) {
    const loading =
      props.tmdbSaveApiKeyStatus === RequestStatus.Getting || props.tmdbGetApiKeyStatus === RequestStatus.Getting;
    const error =
      props.tmdbSaveApiKeyStatus === RequestStatus.Error || props.tmdbGetApiKeyStatus === RequestStatus.Error;
    return <TmdbPage {...props} loading={loading} error={error} />;
  }
}

export default connect('user,tmdbApiKey,tmdbSaveApiKeyStatus,tmdbGetApiKeyStatus', actions)(TmdbIntegration);
