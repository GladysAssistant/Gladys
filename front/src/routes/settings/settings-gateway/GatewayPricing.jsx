import { Text } from 'preact-i18n';

const GatewayPricing = ({ children, ...props }) => (
  <div>
    <div class="row mb-4">
      <div class="col text-center">
        <h2 class="mb-1">
          <Text id="gatewayPricing.pricingTitle" />
        </h2>
        <p>
          <Text id="gatewayPricing.pricingSentence" />
        </p>
      </div>
    </div>
    <div class="row">
      <div class="col-md-6">
        <div class="card">
          <div class="card-body">
            <div class="card-category">
              {' '}
              <Text id="gatewayPricing.free" />
            </div>
            <ul class="list-unstyled leading-loose">
              <li>
                <i class="fe fe-check text-success mr-2" aria-hidden="true" />{' '}
                <Text id="gatewayPricing.openSourceSoftware" />
              </li>
              <li>
                <i class="fe fe-x text-danger mr-2" aria-hidden="true" />{' '}
                <Text id="gatewayPricing.endToEndEncryptedRemoteAccess" />
              </li>
              <li>
                <i class="fe fe-x text-danger mr-2" aria-hidden="true" />{' '}
                <Text id="gatewayPricing.dailyEncryptedBackups" />
              </li>
              <li>
                <i class="fe fe-x text-danger mr-2" aria-hidden="true" /> <Text id="gatewayPricing.oneClickRestore" />
              </li>
              <li>
                <i class="fe fe-x text-danger mr-2" aria-hidden="true" /> <Text id="gatewayPricing.remoteWebhooks" />
              </li>
              <li>
                <i class="fe fe-x text-danger mr-2" aria-hidden="true" />{' '}
                <Text id="gatewayPricing.ownTracksApiServer" />
              </li>
              <li>
                <i class="fe fe-x text-danger mr-2" aria-hidden="true" />{' '}
                <Text id="gatewayPricing.privateSlackCommunity" />
              </li>
              <li>
                <i class="fe fe-x text-danger mr-2" aria-hidden="true" />{' '}
                <Text id="gatewayPricing.supportOpenSourceSoftware" />
              </li>
            </ul>
            <div class="text-center mt-6">
              <button class="btn btn-secondary btn-block" disabled>
                <Text id="gatewayPricing.currentPlan" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card">
          <div class="card-status bg-green" />
          <div class="card-body">
            <div class="card-category">
              {' '}
              <Text id="gatewayPricing.gladysPlus" />
            </div>
            <ul class="list-unstyled leading-loose">
              <li>
                <i class="fe fe-check text-success mr-2" aria-hidden="true" />{' '}
                <Text id="gatewayPricing.openSourceSoftware" />
              </li>
              <li>
                <i class="fe fe-check text-success mr-2" aria-hidden="true" />{' '}
                <Text id="gatewayPricing.endToEndEncryptedRemoteAccess" />
              </li>
              <li>
                <i class="fe fe-check text-success mr-2" aria-hidden="true" />{' '}
                <Text id="gatewayPricing.dailyEncryptedBackups" />
              </li>
              <li>
                <i class="fe fe-check text-success mr-2" aria-hidden="true" />{' '}
                <Text id="gatewayPricing.oneClickRestore" />
              </li>
              <li>
                <i class="fe fe-check text-success mr-2" aria-hidden="true" />{' '}
                <Text id="gatewayPricing.remoteWebhooks" />
              </li>
              <li>
                <i class="fe fe-check text-success mr-2" aria-hidden="true" />{' '}
                <Text id="gatewayPricing.ownTracksApiServer" />
              </li>
              <li>
                <i class="fe fe-check text-success mr-2" aria-hidden="true" />{' '}
                <Text id="gatewayPricing.privateSlackCommunity" />
              </li>
              <li>
                <i class="fe fe-check text-success mr-2" aria-hidden="true" />{' '}
                <Text id="gatewayPricing.supportOpenSourceSoftware" />
              </li>
            </ul>
            <div class="text-center mt-6">
              <a href="#" class="btn btn-green btn-block">
                <Text id="gatewayPricing.subscribeButton" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row" style="margin-bottom: 30px">
      <div class="col text-center">
        Already a Gladys Plus Subscriber? Click{' '}
        <a href="#" onClick={props.displayGatewayLoginForm}>
          here
        </a>{' '}
        to login.
      </div>
    </div>
  </div>
);

export default GatewayPricing;
