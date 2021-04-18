import { Text, MarkupText, Localizer } from 'preact-i18n';
import { RequestStatus } from '../../../../utils/consts';
import cx from 'classnames';

const PiholePage = ({ children, ...props }) => (
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
                        <Text id="integration.pihole.title" />
                      </h2>
                      <p>
                        <MarkupText id="integration.pihole.introduction" />
                      </p>
                      {props.piholeSaveIpStatus === RequestStatus.Error && (
                        <div class="alert alert-danger">
                          <Text id="integration.pihole.configurationError" />
                        </div>
                      )}
                      <form onSubmit={props.savePiholeIp}>
                        <div class="form-group">
                          <div class="form-label">
                            <Text id="integration.pihole.piholeIp" />
                          </div>
                          <div class="input-group">
                            <Localizer>
                              <input
                                type="text"
                                class="form-control"
                                placeholder={<Text id="integration.pihole.piholeIp" />}
                                onInput={props.updatePiholeIp}
                                value={props.piholeIp}
                              />
                            </Localizer>
                            <span class="input-group-append">
                              <button type="submit" class="btn btn-primary">
                                <Text id="integration.pihole.saveButton" />
                              </button>
                            </span>
                          </div>
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

export default PiholePage;
