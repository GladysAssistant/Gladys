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
  wantYearlyUpgrade = () => {
    this.setState({
      confirmUpgrade: true
    });
  };
  cancelYearlyUpgrade = () => {
    this.setState({
      confirmUpgrade: false
    });
  };
  upgradeMonthlyToYearly = async () => {
    try {
      await this.setState({ upgradeYearlyError: false, loading: true });
      await this.props.session.gatewayClient.upgradeMonthlyToYearly();
      await this.setState({ upgradeYearlySuccess: true });
    } catch (e) {
      await this.setState({ upgradeYearlyError: true });
      console.error(e);
    }
    await this.getCurrentPlan();
    await this.setState({ loading: false, confirmUpgrade: false });
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

  render(props, { loading, upgradeYearlyError, plan, upgradeYearlySuccess, confirmUpgrade }) {
    return (
      <SettingsLayout>
        <GatewayBilling
          openStripeBilling={this.openStripeBilling}
          getCurrentPlan={this.getCurrentPlan}
          upgradeMonthlyToYearly={this.upgradeMonthlyToYearly}
          loading={loading}
          upgradeYearlyError={upgradeYearlyError}
          upgradeYearlySuccess={upgradeYearlySuccess}
          confirmUpgrade={confirmUpgrade}
          wantYearlyUpgrade={this.wantYearlyUpgrade}
          cancelYearlyUpgrade={this.cancelYearlyUpgrade}
          plan={plan}
        />
      </SettingsLayout>
    );
  }
}

export default connect('session', actions)(SettingsBilling);
