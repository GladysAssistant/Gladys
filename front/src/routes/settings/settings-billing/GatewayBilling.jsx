import { Text } from 'preact-i18n';
import { StripeProvider, Elements } from 'react-stripe-elements';
import MyStoreCheckout from './MyStoreCheckout';
const dateDisplayOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

const Billing = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="gatewayBilling.title" />
      </h3>
    </div>
    <div class="card-body">
      <div class={props.loading ? 'dimmer active' : 'dimmer'}>
        <div class="loader" />
        <div class="dimmer-content">
          <div class="row">
            <div class="col-md-8">
              <h3>
                <Text id="gatewayBilling.informationTitle" />
              </h3>
              <p>
                <Text id="gatewayBilling.stripeDescription" />
              </p>
              {props.stripeCard && (
                <div class="row">
                  <div class="col-md-4">
                    <label>
                      <Text id="gatewayBilling.cardTypeLabel" />
                    </label>
                    <input type="text" class="form-control" disabled="disabled" value={props.stripeCard.brand} />
                  </div>

                  <div class="col-md-4">
                    <label>
                      <Text id="gatewayBilling.cardLastDigitsLabel" />
                    </label>
                    <input type="text" class="form-control" disabled="disabled" value={props.stripeCard.last4} />
                  </div>

                  <div class="col-md-4">
                    <label>
                      <Text id="gatewayBilling.cardExpirationLabel" />
                    </label>
                    <input
                      type="text"
                      class="form-control"
                      disabled="disabled"
                      value={props.stripeCard.exp_month + '/' + props.stripeCard.exp_year}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <hr />
          <div class="row">
            <div class="col-md-8">
              <h3>
                <Text id="gatewayBilling.updateInformationTitle" />
              </h3>
              <p>
                <Text id="gatewayBilling.updateInformationDescription" />
              </p>

              {props.stripeLoaded && (
                <StripeProvider apiKey={process.env.STRIPE_API_KEY}>
                  <Elements>
                    <MyStoreCheckout
                      saveBillingInformations={props.saveBillingInformations}
                      userCardName={props.userCardName}
                      updateUserCardName={props.updateUserCardName}
                      updateBillingRequestPending={props.updateBillingRequestPending}
                    />
                  </Elements>
                </StripeProvider>
              )}
            </div>
          </div>
          <hr />
          <div class="row">
            <div class="col-md-8">
              <h3>
                <Text id="gatewayBilling.cancelSubscriptionTitle" />
              </h3>

              {props.cancelMonthlySubscriptionError && (
                <div class="alert alert-warning" role="alert">
                  <Text id="gatewayBilling.cancelSubscriptionError" />
                </div>
              )}

              {props.cancelMonthlySubscriptionSuccess && (
                <div class="alert alert-success" role="alert">
                  <Text id="gatewayBilling.cancelSubscriptionSuccess" />
                </div>
              )}

              {props.stripeCard && props.stripeCard.canceled_at === null && (
                <div>
                  <p>
                    <Text id="gatewayBilling.cancelSubscriptionDescription" />
                  </p>
                  <button onClick={props.cancelMonthlySubscription} class="btn btn-danger">
                    <Text id="gatewayBilling.cancelSubscriptionButton" />
                  </button>
                </div>
              )}

              {props.stripeCard && props.stripeCard.canceled_at && (
                <div>
                  <p>
                    <Text
                      id="gatewayBilling.accountCancelled"
                      fields={{
                        date: new Date(props.stripeCard.canceled_at).toLocaleDateString('en-US', dateDisplayOptions)
                      }}
                    />
                  </p>
                  <button onClick={props.reSubcribeMonthlyPlan} class="btn btn-success">
                    <Text id="gatewayBilling.subscriptionButton" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Billing;
