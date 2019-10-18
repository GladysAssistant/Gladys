import { StripeProvider, Elements } from 'react-stripe-elements';
import MyStoreCheckout from './MyStoreCheckout';
const dateDisplayOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

const Billing = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">Billing</h3>
    </div>
    <div class="card-body">
      <div class={props.loading ? 'dimmer active' : 'dimmer'}>
        <div class="loader" />
        <div class="dimmer-content">
          <div class="row">
            <div class="col-md-8">
              <h3>Your billing informations</h3>
              <p>Billing is handled by Stripe. We never see you credit card.</p>
              {props.stripeCard && (
                <div class="row">
                  <div class="col-md-4">
                    <label>Type</label>
                    <input type="text" class="form-control" disabled="disabled" value={props.stripeCard.brand} />
                  </div>

                  <div class="col-md-4">
                    <label>Last 4 digits</label>
                    <input type="text" class="form-control" disabled="disabled" value={props.stripeCard.last4} />
                  </div>

                  <div class="col-md-4">
                    <label>Expiration date</label>
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
              <h3>Update Card Informations</h3>
              <p>
                If your card has expired, or you want to change credit card, you can update here your card information.
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
              <h3>Cancel subscription</h3>

              {props.cancelMonthlySubscriptionError && (
                <div class="alert alert-warning" role="alert">
                  Warning: There was an error while trying to cancel your account. Please retry again later.
                </div>
              )}

              {props.cancelMonthlySubscriptionSuccess && (
                <div class="alert alert-success" role="alert">
                  Your subscription was canceled with success!
                </div>
              )}

              {props.stripeCard && props.stripeCard.canceled_at === null && (
                <div>
                  <p>If you want to cancel your account, click here:</p>
                  <button onClick={props.cancelMonthlySubscription} class="btn btn-danger">
                    Cancel subscription
                  </button>
                </div>
              )}

              {props.stripeCard && props.stripeCard.canceled_at && (
                <div>
                  <p>
                    Your account was cancelled on{' '}
                    {new Date(props.stripeCard.canceled_at).toLocaleDateString('en-US', dateDisplayOptions)}
                  </p>
                  <button onClick={props.reSubcribeMonthlyPlan} class="btn btn-success">
                    Subscribe again
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
