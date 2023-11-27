import { Component } from 'preact';
import { connect } from 'unistore/preact';
import GatewayBilling from './GatewayBilling';
import SettingsLayout from '../SettingsLayout';
import actions from '../../../actions/gateway';

class SettingsBilling extends Component {
  getSetupState = async () => {
    await this.setState({ loading: true });
    const setupState = await this.props.session.gatewayClient.getSetupState();
    this.setState({
      setupState,
      loading: false
    });
  };
  getCurrentPlan = async () => {
    try {
      const { plan } = await this.props.session.gatewayClient.getCurrentPlan();
      this.setState({
        plan
      });
    } catch (e) {
      console.error(e);
    }
  };
  openStripeBilling = async () => {
    window.open(
      `${this.props.session.gladysGatewayApiUrl}/accounts/stripe_customer_portal/${this.state.setupState.stripe_portal_key}`
    );
  };

  componentWillMount() {
    this.getSetupState();
    this.getCurrentPlan();
  }

  render(props, { loading }) {
    return (
      <SettingsLayout>
        <GatewayBilling openStripeBilling={this.openStripeBilling} loading={loading} />
      </SettingsLayout>
    );
  }
}

export default connect('session', actions)(SettingsBilling);
