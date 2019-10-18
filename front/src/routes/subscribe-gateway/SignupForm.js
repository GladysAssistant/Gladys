import { StripeProvider, Elements } from 'react-stripe-elements';
import { Text, Localizer } from 'preact-i18n';
import MyStoreCheckout from './MyStoreCheckout';

const SignupForm = ({ children, ...props }) => (
  <form className="card" style={{ height: '100%' }}>
    <div className="card-body p-6">
      <div className="card-title">
        <Text id="gatewaySubscribe.registerGladysPlus" />
      </div>

      {props.accountAlreadyExist && (
        <div class="alert alert-danger" role="alert">
          <Text id="gatewaySubscribe.emailAlreadyExist" />
        </div>
      )}

      {props.paymentFailed && (
        <div class="alert alert-danger" role="alert">
          <Text id="gatewaySubscribe.paymentFailed" />
        </div>
      )}

      {props.paymentSuccess && (
        <div class="alert alert-success" role="alert">
          <Text id="gatewaySubscribe.paymentSuccess" />
        </div>
      )}

      {!props.paymentSuccess && (
        <div>
          <div className="form-group">
            <label className="form-label">
              <Text id="gatewaySubscribe.emailAddress" />
            </label>
            <Localizer>
              <input
                type="email"
                className={'form-control ' + (props.emailErrored ? 'is-invalid' : '')}
                placeholder={<Text id="gatewaySubscribe.emailAddressPlaceholder" />}
                value={props.email}
                onInput={props.updateEmail}
              />
            </Localizer>
            <div class="invalid-feedback">
              <Text id="gatewaySubscribe.invalidEmailAddress" />
            </div>
          </div>
          <StripeProvider apiKey={process.env.STRIPE_API_KEY}>
            <Elements>
              <MyStoreCheckout
                language={props.language}
                subscribeToPlan={props.subscribeToPlan}
                updateRequestPending={props.updateRequestPending}
                requestPending={props.requestPending}
                updatePaymentFailed={props.updatePaymentFailed}
              />
            </Elements>
          </StripeProvider>
        </div>
      )}
    </div>
  </form>
);

export default SignupForm;
