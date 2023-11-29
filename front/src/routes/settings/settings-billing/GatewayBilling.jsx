import { Text } from 'preact-i18n';

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
            <div class="col-md-12">
              <h3>
                <Text id="gatewayBilling.informationTitle" />
              </h3>
              <p>
                <Text id="gatewayBilling.stripeDescription" />
              </p>
              <button class="btn btn-primary mr-2" onClick={props.openStripeBilling}>
                <Text id="gatewayBilling.stripeButton" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Billing;
