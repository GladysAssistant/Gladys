import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import Select from 'react-select';

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
                        <MarkupText id="integration.stockExchange.instructions" />
                      </p>

                      <div class="form-group">
                        <div class="form-label">
                          <Text id="integration.stockExchange.apiKeyLabel" />
                        </div>
                        <div class="input-group">
                          <Localizer>
                            <input
                              type="text"
                              class="form-control"
                              name="stockExchangeApiKey"
                              placeholder={<Text id="integration.stockExchange.apiKeyPlaceholder" />}
                              onInput={props.updateConfiguration}
                              value={props.stockExchangeApiKey}
                            />
                          </Localizer>
                        </div>
                      </div>

                      <div class="form-group">
                        <div class="form-label">
                          <Text id="integration.stockExchange.selectTickerLabel" />
                        </div>
                        <Text id="integration.stockExchange.selectTickerDescription" />
                        <div>
                          <Select
                            isMulti
                            isSearchable
                            options={props.tickersOptions}
                            onChange={props.onTickersChange}
                            value={props.selectedTickers}
                          />
                        </div>
                      </div>

                      <p>
                        <Text id="integration.stockExchange.instructionsToUse" />
                      </p>
                      <div class="form-group">
                        <span class="input-group-append">
                          <button class="btn btn-primary" style={{ zIndex: 0 }} onClick={props.saveConfiguration}>
                            <Text id={`integration.stockExchange.saveButton`} />
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
