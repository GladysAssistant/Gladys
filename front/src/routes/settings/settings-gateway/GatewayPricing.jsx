import { Text } from 'preact-i18n';

const GatewayPricing = ({ children, ...props }) => (
  <div class="mt-4">
    <div class="row mb-4">
      <div class="col text-center">
        <h2 class="mb-1">
          <Text id="gatewayPricing.pricingTitle" />
        </h2>
      </div>
    </div>
    <div class="row mb-4">
      <div class="col-md-12">
        <p>
          <Text id="gatewayPricing.pricingSentence" />
        </p>
      </div>
    </div>
    <div class="row mb-4">
      <div class="col-md-12">
        <h4>
          <Text id="gatewayPricing.whyIsGladysPlusPaid" />
        </h4>
        <p>
          <Text id="gatewayPricing.whyIsGladysPlusPaidAnswer" />
        </p>
      </div>
    </div>
    <div class="row mb-4">
      <div class="col-md-12">
        <p>
          <Text id="gatewayPricing.supportOpenSource" />
        </p>
      </div>
    </div>
    <div class="row">
      <div class="col-md-12 text-center">
        <a
          class="btn btn-success mr-2"
          href={`https://gladysassistant.com/${props.user.language}/plus`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Text id="gatewayPricing.knowMoreButton" />
        </a>
        <button class="btn btn-primary" onClick={props.displayGatewayLoginForm}>
          <Text id="gatewayPricing.alreadyGladysPlusSubscriber" />
        </button>
      </div>
    </div>
  </div>
);

export default GatewayPricing;
