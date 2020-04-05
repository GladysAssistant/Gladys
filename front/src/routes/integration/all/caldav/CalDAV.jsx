import { Text, MarkupText } from 'preact-i18n';
import { CalDAVStatus } from '../../../../utils/consts';
import cx from 'classnames';

const CaldavPage = ({ children, ...props }) => (
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
                        <Text id="integration.caldav.title" />
                      </h2>
                      <p>
                        <Text id="integration.caldav.introduction" />
                      </p>
                      <div class="form-group">
                        <div class="form-label">CalDAV host</div>
                        <Text id="integration.caldav.hostInfo" />
                        <select class="form-control" onChange={props.updateCaldavHost} value={props.caldavHost}>
                          {Object.keys(props.dictionary.services).map(host => (
                            <option value={host}>
                              <Text id={`integration.caldav.services.${host}.name`} />
                            </option>
                          ))}
                        </select>
                      </div>
                      <div class="form-group">
                        <div class="form-label">
                          <Text id={`integration.caldav.services.${props.caldavHost}.url`} />
                        </div>
                        <Text id={`integration.caldav.services.${props.caldavHost}.urlInfo`} />
                        <input
                          type="text"
                          class="form-control"
                          placeholder="CalDAV URL"
                          onInput={props.updateCaldavUrl}
                          value={props.caldavUrl}
                        />
                      </div>
                      <div class="form-group">
                        <div class="form-label">
                          <Text id={`integration.caldav.services.${props.caldavHost}.username`} />
                        </div>
                        <Text id={`integration.caldav.services.${props.caldavHost}.usernameInfo`} />
                        <input
                          type="text"
                          class="form-control"
                          placeholder="CalDAV username"
                          onInput={props.updateCaldavUsername}
                          value={props.caldavUsername}
                        />
                      </div>
                      <div class="form-group">
                        <div class="form-label">
                          <Text id={`integration.caldav.services.${props.caldavHost}.password`} />
                        </div>
                        <MarkupText id={`integration.caldav.services.${props.caldavHost}.passwordInfo`} />
                        <input
                          type="password"
                          class="form-control"
                          placeholder="CalDAV password"
                          onInput={props.updateCaldavPassword}
                          value={props.caldavPassword}
                        />
                      </div>
                      {(props.caldavSaveSettingsStatus === CalDAVStatus.BadCredentialsError ||
                        props.caldavSaveSettingsStatus === CalDAVStatus.BadUrlError ||
                        props.caldavSaveSettingsStatus === CalDAVStatus.RetrievePrincipalUrlError ||
                        props.caldavSaveSettingsStatus === CalDAVStatus.RetrieveHomeUrlError ||
                        props.caldavSaveSettingsStatus === CalDAVStatus.Error) && (
                        <div class="alert alert-danger">
                          <Text id="integration.caldav.configurationDefaultError" />
                          <p style={{ marginBottom: '0', fontStyle: 'italic' }}>
                            <Text id={`integration.caldav.configuration${props.caldavSaveSettingsStatus}`} />
                          </p>
                        </div>
                      )}
                      {props.caldavSaveSettingsStatus === CalDAVStatus.Success && (
                        <p class="alert alert-info">
                          <Text id="integration.caldav.configurationSuccess" />
                        </p>
                      )}
                      {props.caldavCleanUpStatus === CalDAVStatus.Error && (
                        <div class="alert alert-danger">
                          <Text id="integration.caldav.cleanUpError" />
                        </div>
                      )}
                      {props.caldavCleanUpStatus === CalDAVStatus.Success && (
                        <p class="alert alert-info">
                          <Text id="integration.caldav.cleanUpSuccess" />
                        </p>
                      )}
                      {(props.caldavSyncStatus === CalDAVStatus.BadCredentialsError ||
                        props.caldavSyncStatus === CalDAVStatus.RequestCalendarsError ||
                        props.caldavSyncStatus === CalDAVStatus.RequestChangesError ||
                        props.caldavSyncStatus === CalDAVStatus.RequestEventsError ||
                        props.caldavSyncStatus === CalDAVStatus.Error) && (
                        <div class="alert alert-danger">
                          <Text id="integration.caldav.synchronizationDefaultError" />
                          <p style={{ marginBottom: '0', fontStyle: 'italic' }}>
                            <Text id={`integration.caldav.synchronization${props.caldavSyncStatus}`} />
                          </p>
                        </div>
                      )}
                      {props.caldavSyncStatus === CalDAVStatus.Success && (
                        <p class="alert alert-info">
                          <Text id="integration.caldav.synchronizationSuccess" />
                        </p>
                      )}
                      <div class="form-group">
                        <div style={{ marginBottom: '10px' }}>
                          <Text id={`integration.caldav.synchronizationInfo`} />
                        </div>
                        <span class="input-group-append">
                          <button class="btn btn-primary" onClick={props.saveCaldavSettings}>
                            <Text id={`integration.caldav.buttonSave`} />
                          </button>
                          <button
                            class="btn btn-danger"
                            onClick={props.cleanUp}
                            style={{ marginLeft: '10px', marginRight: '10px' }}
                          >
                            <Text id={`integration.caldav.buttonCleanUp`} />
                          </button>
                          <button class="btn btn-success" onClick={props.startSync}>
                            <Text id={`integration.caldav.buttonSync`} />
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

export default CaldavPage;
