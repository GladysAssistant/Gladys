import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';

class InfluxDBPage extends Component {
  updateInfluxdbUrl = e => {
    this.props.updateConfiguration({ influxdbUrl: e.target.value });
  };
  updateInfluxdbToken = e => {
    this.props.updateConfiguration({ influxdbToken: e.target.value });
  };
  updateInfluxdbOrg = e => {
    this.props.updateConfiguration({ influxdbOrg: e.target.value });
  };
  updateInfluxdbBucket = e => {
    this.props.updateConfiguration({ influxdbBucket: e.target.value });
  };
  testConnection = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.testConnection();
      this.setState({
        testConnectionError: null,
        testConnectionErrorMessage: null
      });
    } catch (e) {
      this.setState({
        testConnectionError: RequestStatus.Error,
        testConnectionErrorMessage: get(e, 'response.data.error')
      });
    }
    this.setState({
      loading: false
    });
  };
  render(props) {
    return (
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
                          <form>
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
                                    value={props.influxdbUrl}
                                    onInput={this.updateInfluxdbUrl}
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
                                    onInput={this.updateInfluxdbToken}
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
                                    onInput={this.updateInfluxdbOrg}
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
                                    onInput={this.updateInfluxdbBucket}
                                    value={props.influxdbBucket}
                                  />
                                </Localizer>
                              </div>
                            </div>
                            <div class="form-group">
                              <button
                                class={cx('btn', 'btn-success' , 'mr-2', {
                                  'btn-loading': props.loading
                                })}
                                type="submit"
                                onClick={props.saveConfiguration}
                              >
                                <Text id="integration.influxdb.saveButton" />
                              </button>
                              <button onClick={this.testConnection} class="btn btn-info mr-2">
                    <Text id="integration.influxdb.testConnectionButton" />
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
  }
}

export default InfluxDBPage;
