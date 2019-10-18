import { Component } from 'preact';
import { connect } from 'unistore/preact';
import GatewayBilling from './GatewayBilling';
import SettingsLayout from '../SettingsLayout';
import actions from '../../../actions/gateway';
import { RequestStatus } from '../../../utils/consts';

@connect(
  'stripeCard,savingBillingError,paymentInProgress,cancelMonthlySubscriptionSuccess,cancelMonthlySubscriptionError,reSubscribeMonthlyPlanError,stripeLoaded,billingRequestStatus',
  actions
)
class SettingsBilling extends Component {
  componentWillMount() {
    this.props.refreshCard();
    this.props.loadStripe();
  }

  render(props, {}) {
    const loading = props.billingRequestStatus === RequestStatus.Getting;
    return (
      <SettingsLayout>
        <GatewayBilling {...props} loading={loading} />
      </SettingsLayout>
    );
  }
}

export default SettingsBilling;
