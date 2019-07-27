import { Text, MarkupText } from 'preact-i18n';
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
                        <MarkupText id="integration.caldav.introduction" />
                      </p>
                      <div class="form-group">
                        <div class="form-label">CalDAV host</div>
                        <select class="form-control" onChange={props.updateCaldavHost} value={props.caldavHost}>
                          {['apple', 'other'].map(host => (
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
                        <input
                          type="password"
                          class="form-control"
                          placeholder="CalDAV password"
                          onInput={props.updateCaldavPassword}
                          value={props.caldavPassword}
                        />
                      </div>
                      <div class="form-group">
                        <span class="input-group-append">
                          <button
                            class="btn btn-primary"
                            onClick={props.saveCaldavSettings}
                            style={{ marginRight: '10px' }}
                          >
                            Save
                          </button>
                          <button class="btn btn-primary" onClick={props.startSync}>
                            Try Sync
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
