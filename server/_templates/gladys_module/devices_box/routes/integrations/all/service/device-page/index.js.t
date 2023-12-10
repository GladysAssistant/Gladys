---
to: ../front/src/routes/integration/all/<%= module %>/device-page/index.js
---
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import <%= className %>Page from '../<%= className %>Page';
import DeviceTab from './DeviceTab';

class <%= className %>Integration extends Component {
  async componentWillMount() {
    this.props.get<%= className %>Devices();
    this.props.getHouses();
    this.props.getIntegrationByName('<%= module %>');
  }

  render(props) {
    return (
      <<%= className %>Page user={props.user}>
        <DeviceTab {...props} />
      </<%= className %>Page>
    );
  }
}

export default connect(
  'session,user,<%= attributeName %>Devices,houses,status',
  actions
)(<%= className %>Integration);