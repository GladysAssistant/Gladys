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
          {props.plan && (
            <div class="row mt-6">
              <div class="col-md-12">
                <h3>
                  <Text id="gatewayBilling.yourCurrentPlan" />
                </h3>
                {props.upgradeYearlyError && (
                  <div class="alert alert-danger" role="alert">
                    <Text id="gatewayBilling.upgradeYearlyError" />
                  </div>
                )}
                {props.upgradeYearlySuccess && (
                  <div class="alert alert-success" role="alert">
                    <Text id="gatewayBilling.upgradeYearlySuccess" />
                  </div>
                )}
                <p>
                  {props.plan === 'yearly' && <Text id="gatewayBilling.yearlyPlan" />}
                  {props.plan === 'monthly' && <Text id="gatewayBilling.monthlyPlan" />}
                </p>
                {props.plan === 'monthly' && (
                  <div>
                    {!props.confirmUpgrade && (
                      <button class="btn btn-success mr-2" onClick={props.wantYearlyUpgrade}>
                        <Text id="gatewayBilling.upgradeToYearly" />
                      </button>
                    )}
                    {props.confirmUpgrade && (
                      <button class="btn btn-success mr-2" onClick={props.upgradeMonthlyToYearly}>
                        <Text id="gatewayBilling.confirmUpgradeToYearly" />
                      </button>
                    )}
                    {props.confirmUpgrade && (
                      <button class="btn btn-danger mr-2" onClick={props.cancelYearlyUpgrade}>
                        <Text id="gatewayBilling.cancelUpgradeToYearly" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default Billing;
