import { Text, MarkupText, Localizer } from 'preact-i18n';
import { RequestStatus } from '../../../../utils/consts';
import cx from 'classnames';

const PushoverPage = ({ children, ...props }) => (
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
                        <Text id="integration.pushover.title" />
                      </h2>
                      <p>
                        <MarkupText id="integration.pushover.introduction" />
                      </p>
                      {(props.pushoverSaveApiKeyStatus === RequestStatus.Error || props.pushoverSaveUserKeyStatus === RequestStatus.Error) && (
                        <div class="alert alert-danger">
                          <Text id="integration.pushover.configurationError" />
                        </div>
                      )}
                      <form onSubmit={props.savePushover}>
                        <div class="form-group">
                          <div class="form-label">
                            <Text id="integration.pushover.apiKey" />
                          </div>
                          <div class="input-group">
                            <Localizer>
                              <input
                                type="text"
                                class="form-control"
                                placeholder={<Text id="integration.pushover.apiKey" />}
                                onInput={props.updatePushoverApiKey}
                                value={props.pushoverApiKey}
                              />
                            </Localizer>
                          </div>
                        </div>
						
                        <div class="form-group">
                          <div class="form-label">
                            <Text id="integration.pushover.userKey" />
                          </div>
                          <div class="input-group">
                            <Localizer>
                              <input
                                type="text"
                                class="form-control"
                                placeholder={<Text id="integration.pushover.userKey" />}
                                onInput={props.updatePushoverUserKey}
                                value={props.pushoverUserKey}
                              />
                            </Localizer>
                          </div>
						  <br/>
						  <span class="input-group-append">
                             <button type="submit" class="btn btn-primary">
                               <Text id="integration.pushover.saveButton" />
                             </button>
                           </span>
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

export default PushoverPage;
