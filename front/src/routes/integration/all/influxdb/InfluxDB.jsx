import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { InfluxdbStatus } from '../../../../utils/consts';

const InfluxDBPage = ({ children, ...props }) => (
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
                        <Text id="integration.influxdb.title" />
                      </h2>
                      <p>
                        <Text id="integration.influxdb.introduction" />
                      </p>
                      <form onSubmit={props.saveApiKey}>
                        <div class="form-group">
                          <div class="form-label">
                            <Text id="integration.influxdb.urlLabel" />
                          </div>
                          <div class="input-group">
                            <Localizer>
                              <input
                                type="text"
                                class="form-control"
                                placeholder={<Text id="integration.influxdb.urlPlaceholder" />}
                                onInput={props.updateApiKey}
                                value={props.influxdbUrl}
                              />
                            </Localizer>
                          </div>
                        </div>{' '}
                        <div class="form-group">
                          <div class="form-label">
                            <Text id="integration.influxdb.tokenLabel" />
                          </div>
                          <div class="input-group">
                            <Localizer>
                              <input
                                type="text"
                                class="form-control"
                                placeholder={<Text id="integration.influxdb.tokenPlaceholder" />}
                                onInput={props.updateApiKey}
                                value={props.influxdbToken}
                              />
                            </Localizer>
                          </div>
                        </div>
                        <div class="form-group">
                          <div class="form-label">
                            <Text id="integration.influxdb.orgLabel" />
                          </div>
                          <div class="input-group">
                            <Localizer>
                              <input
                                type="text"
                                class="form-control"
                                placeholder={<Text id="integration.influxdb.orgPlaceholder" />}
                                onInput={props.updateApiKey}
                                value={props.influxdbOrg}
                              />
                            </Localizer>
                          </div>
                        </div>
                        <div class="form-group">
                          <div class="form-label">
                            <Text id="integration.influxdb.bucketLabel" />
                          </div>
                          <div class="input-group">
                            <Localizer>
                              <input
                                type="text"
                                class="form-control"
                                placeholder={<Text id="integration.influxdb.bucketPlaceholder" />}
                                onInput={props.updateApiKey}
                                value={props.influxdbToken}
                              />
                            </Localizer>
                          </div>
                        </div>
                        <div class="form-group">
                          <button
                            class={cx('btn', 'btn-success', {
                              'btn-loading': props.loading
                            })}
                            type="submit"
                          >
                            <Text id="integration.influxdb.saveButton" />
                          </button>
                        </div>
                      </form>
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

export default InfluxDBPage;
