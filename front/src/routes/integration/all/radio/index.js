import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import RadioPage from './RadioPage';
import { RequestStatus } from '../../../../utils/consts';

class RadioInteration extends Component {
  componentWillMount() {
    this.props.getConfig();
  }

  render(props, {}) {
    const loading = props.radioSaveStatus === RequestStatus.Getting || props.radioGetStatus === RequestStatus.Getting;
    return <RadioPage {...props} loading={loading} />;
  }
}

export default connect(
  'user, session, radioDefaultCountry, radioDefaultStation, radioEnableProvider, availableCountry, availableStation, radioSaveStatus, radioGetStatus',
  actions
)(RadioInteration);
