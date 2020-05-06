import { Component } from 'preact';
import { Link } from 'preact-router/match';
import { connect } from 'unistore/preact';
import actions from './actions';
import { Text } from 'preact-i18n';

@connect('user,session,heatzyStatusConnected,heatzyStatusConfigured,heatzyStatusLoaded', actions)
class CheckHeatzyPanel extends Component {
  componentWillMount() {
    this.props.checkStatus();
  }

  render(props, {}) {
    let messageKey;
    if (!props.heatzyStatusConfigured) {
      messageKey = 'integration.heatzy.status.notConfigured';
    } else if (!props.heatzyStatusConnected) {
      messageKey = 'integration.heatzy.status.notConnected';
    } else {
      return null;
    }

    if (!props.heatzyStatusLoaded) {
      return null;
    }

    return (
      <div class="alert alert-warning">
        <Text id={messageKey} />
        <Link href="/dashboard/integration/device/heatzy/setup">
          <Text id="integration.heatzy.status.setupPageLink" />
        </Link>
      </div>
    );
  }
}

export default CheckHeatzyPanel;
