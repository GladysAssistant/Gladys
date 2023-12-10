---
to: ../front/src/routes/integration/all/<%= module %>/index.js
---
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import <%= className %>Page from './<%= className %>Page';
import DeviceTab from './device-page/DeviceTab';

class <%= className %>Integration extends Component {
  componentWillMount() {
    this.props.getIntegrationByName('<%= module %>');
    this.props.loadProps();
    this.props.getHouses();
  }

  componentWillUnmount() {
    // TODO or REMOVE
  }

  render(props, {}) {
    return (
      <<%= className %>Page>
        <DeviceTab {...props} />
      </<%= className %>Page>
    );
  }
}

export default connect(
  'user,session,<%= attributeName %>Devices,houses,status',
  actions
)(<%= className %>Integration);