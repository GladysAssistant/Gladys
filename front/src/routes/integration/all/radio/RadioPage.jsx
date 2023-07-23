import { Component } from 'preact';
import Select from 'react-select';
import { Text, MarkupText } from 'preact-i18n';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import cx from 'classnames';
import { MUSIC } from '../../../../../../server/utils/constants';

class RadioPage extends Component {
  toggleStatus = () => {
    const newStatus =
      this.props.radioEnableProvider === MUSIC.PROVIDER.STATUS.ENABLED
        ? MUSIC.PROVIDER.STATUS.DISABLED
        : MUSIC.PROVIDER.STATUS.ENABLED;
    this.props.enableRadioProvider(newStatus);
  };

  render(props, user, {}) {
    const serviceEnabled = props.radioEnableProvider === MUSIC.PROVIDER.STATUS.ENABLED;
    return (
      <div class="page">
        <div class="page-main">
          <div class="my-3 my-md-5">
            <div class="container">
              <div class="row">
                <div class="col-lg-3">
                  <h3 class="page-title mb-5">
                    <Text id="integration.radio.title" />
                  </h3>
                  <div>
                    <div class="list-group list-group-transparent mb-0">
                      <DeviceConfigurationLink
                        user={user}
                        documentKey="radio"
                        linkClass="list-group-item list-group-item-action d-flex align-items-center"
                      >
                        <span class="icon mr-3">
                          <i class="fe fe-book-open" />
                        </span>
                        <Text id="integration.radio.documentation" />
                      </DeviceConfigurationLink>
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://www.radio-browser.info/"
                        class="list-group-item list-group-item-action d-flex align-items-center"
                      >
                        <span class="icon mr-3">
                          <i class="fe fe-external-link" />
                        </span>
                        <Text id="integration.radio.radioBrowserOfficialWebSite" />
                      </a>
                    </div>
                  </div>
                </div>
                <div class="col-lg-9">
                  <div class="card">
                    <div class="card-header">
                      <h1 class="card-title">
                        <Text id="integration.radio.settings" />
                      </h1>
                    </div>
                    <div class="card-body">
                      <div
                        class={cx('dimmer', {
                          active: props.loading
                        })}
                      >
                        <div class="loader" />
                        <div class="dimmer-content">
                          <p>
                            <MarkupText id="integration.radio.introduction" />
                          </p>

                          <div class="form-group">
                            <label class="custom-switch">
                              <input
                                type="radio"
                                class="custom-switch-input"
                                checked={serviceEnabled}
                                onClick={this.toggleStatus}
                              />
                              <span class="custom-switch-indicator" />
                              <span class="custom-switch-description">
                                <Text id="integration.radio.enableProvider" />
                              </span>
                            </label>
                          </div>

                          <form onSubmit={props.saveConfig}>
                            <div class="form-group">
                              <div class="form-label">
                                <Text id="integration.radio.defaultCountry" />
                              </div>
                              <Select
                                defaultValue={null}
                                value={props.radioDefaultCountry}
                                onChange={props.updateCountry}
                                options={props.availableCountry}
                              />
                            </div>
                            <div class="form-group">
                              <div class="form-label">
                                <Text id="integration.radio.defaultStation" />
                              </div>
                              <Select
                                defaultValue={null}
                                value={props.radioDefaultStation}
                                onChange={props.updateStation}
                                options={props.availableStation}
                              />
                            </div>
                            <div class="form-group">
                              <button
                                class={cx('btn', 'btn-success', {
                                  'btn-loading': props.loading
                                })}
                                type="submit"
                              >
                                <Text id="integration.radio.saveButton" />
                              </button>
                            </div>

                            <div class="form-group">
                              <label>
                                <Text id="integration.radio.instructionsToUse" />
                              </label>
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

export default RadioPage;
