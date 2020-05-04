import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

const StockExchangePage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-12">
              <div class="card">
                <div class="card-body">
                  <div
                    class={cx('dimmer', {
                      active: props.loading
                    })}
                  >
                    <div class="loader" />
                    <div class="dimmer-content">
                      <h2>
                        <Text id="integration.stockExchange.title" />
                      </h2>
                      <p>
                        <Text id="integration.stockExchange.introduction" />
                      </p>
                      <p>
                        <Text id="integration.stockExchange.instructions" />{' '}
                        <a href="https://fmpcloud.io/" target="_blank">Fmp Cloud</a>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default StockExchangePage;
