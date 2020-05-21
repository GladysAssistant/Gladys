import { RequestStatus } from '../../utils/consts';
import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';

const OAuth2Config = ({ integrationImg, integrationName, children, ...props }) => (
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
                      active: props.oauth2GetStatus === RequestStatus.Getting
                    })}
                  >
                    <div class="loader" />
                    {props.oauth2GetStatus !== RequestStatus.Getting && !props.clientIdInDb && (
                      <div class="dimmer-content">
                        <h2>
                          <Text id={`integration.${integrationName}.settings.title`} />
                        </h2>
                        {props.oauth2ErrorMsg && (
                          <div class="alert alert-danger">
                            <Text id={`integration.oauth2.${props.oauth2ErrorMsg}`} />
                          </div>
                        )}
                        <p>
                          <MarkupText id={`integration.${integrationName}.settings.introduction`} />
                        </p>
                        <p>
                          <MarkupText id={`integration.oauth2.instructions`} />
                        </p>
                        <div class="form-group">
                          <div class="form-label">
                            <Text id={`integration.oauth2.apiKeyLabel`} />
                          </div>
                          <div class="input-group">
                            <Localizer>
                              <input
                                type="text"
                                class="form-control"
                                placeholder={<Text id={`integration.oauth2.clientId`} />}
                                onInput={props.updateClientId}
                                value={props.clientId}
                              />
                            </Localizer>
                          </div>
                        </div>
                        <div class="form-group">
                          <div class="input-group">
                            <Localizer>
                              <input
                                type="text"
                                class="form-control"
                                placeholder={<Text id={`integration.oauth2.secretId`} />}
                                onInput={props.updateSecretId}
                                value={props.secretId}
                              />
                            </Localizer>
                          </div>
                        </div>
                        <div class="form-group">
                          <span class="input-group-append">
                            <button class="btn btn-primary" onClick={props.startConnect}>
                              <Text id={`integration.oauth2.buttonConnect`} />
                            </button>
                          </span>
                        </div>
                      </div>
                    )}
                    {props.oauth2GetStatus === RequestStatus.Success && props.clientIdInDb && (
                      <div class="dimmer-content">
                        <h2>
                          <Text id={`integration.${integrationName}.settings.title`} />
                        </h2>
                        <div class="alert alert-info">
                          <p>
                            <Text id={`integration.${integrationName}.settings.complete`} />
                          </p>
                          <p>
                            <b>
                              <Text id={`integration.${integrationName}.settings.clientId`} />
                            </b>
                            {`${props.clientIdInDb}`}
                          </p>
                          <p>
                            <Text id={`integration.${integrationName}.settings.afterIntegration`} />
                          </p>
                          <p>
                            <Text id={`integration.${integrationName}.settings.instructionsToUse`} />
                          </p>
                        </div>
                        <p>
                          <Text id="integration.oauth2.delete" />
                        </p>
                        <div class="form-group">
                          <span class="input-group-append">
                            <button class="btn btn-primary" onClick={props.unConnect}>
                              <Text id={`integration.oauth2.buttonUnConnect`} />
                            </button>
                          </span>
                        </div>
                      </div>
                    )}
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

export default OAuth2Config;
