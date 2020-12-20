import { Component } from 'preact';
import { connect } from 'unistore/preact';
import GatewayBilling from './GatewayBilling';
import SettingsLayout from '../SettingsLayout';
import actions from '../../../actions/gateway';

@connect('session', actions)
class SettingsBilling extends Component {
  getSetupState = async () => {
    await this.setState({ loading: true });
    const setupState = await this.props.session.gatewayClient.getSetupState();
    this.setState({
      setupState,
      loading: false
    });
  };
  openStripeBilling = async () => {
    window.open(
      `${this.props.session.gladysGatewayApiUrl}/accounts/stripe_customer_portal/${this.state.setupState.stripe_portal_key}`
    );
  };
  componentWillMount() {
    this.getSetupState();
  }

  render(props, { setupState, loading }) {
    return (
      <SettingsLayout>
        <GatewayBilling openStripeBilling={this.openStripeBilling} loading={loading} />
      </SettingsLayout>
    );
  }
}

export default SettingsBilling;
