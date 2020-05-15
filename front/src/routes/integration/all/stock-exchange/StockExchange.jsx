import { Text, Localizer, MarkupText } from 'preact-i18n';
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
                        <MarkupText id="integration.stockExchange.introduction" />
                      </p>
                      <p>
                        <Text id="integration.stockExchange.instructions" />
                      </p>

                      <div class="form-group">
                        <div class="form-label">
                          <Text id="integration.stockExchange.selectTickerLabel" />
                        </div>
                        <Text id="integration.stockExchange.selectTickerDescription" />
                        <select class="form-control" onChange={props.updateTickers} value={props.tickers}>
                          <option value="^FCHI">
                            CAC40
                          </option>
                          <option value="AC.PA">
                            Accor
                          </option>
                          <option value="GIB">
                            CGI
                          </option>
                          <option value="RNO.PA">
                            Renault
                          </option>
                        </select>
                      </div>

                      <p>
                        <Text id="integration.stockExchange.instructionsToUse" />
                      </p>
                      <div class="form-group">
                        <span class="input-group-append">
                          <button class="btn btn-primary" onClick={props.saveStockExchangeSettings}>
                            <Text id={`integration.stockexchange.buttonSave`} />
                          </button>
                        </span>
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
  </div>
);

export default StockExchangePage;
