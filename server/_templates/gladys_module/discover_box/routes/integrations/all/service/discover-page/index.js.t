---
to: ../front/src/routes/integration/all/<%= module %>/discover-page/index.js
---
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import <%= className %>Page from '../<%= className %>Page';
import DiscoverTab from './DiscoverTab';

class <%= className %>Integration extends Component {
  async componentWillMount() {
    this.props.getDiscovered<%= className %>Devices();
    this.props.getHouses();
    this.props.getIntegrationByName('<%= module %>');
  }

  render(props) {
    return (
      <<%= className %>Page user={props.user}>
        <DiscoverTab {...props} />
      </<%= className %>Page>
    );
  }
}

export default connect(
  'user,session,httpClient,houses,discoveredDevices,loading,errorLoading',
  actions
)(<%= className %>Integration);