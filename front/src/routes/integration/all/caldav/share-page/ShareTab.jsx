import { Text } from 'preact-i18n';
import cx from 'classnames';
import { CalDAVStatus } from '../../../../../utils/consts';

import style from './ShareTab.css';

const ShareTab = ({ children, ...props }) => (
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
                        <Text id="integration.caldav.shareTab" />
                      </h2>
                      <p>
                        <Text id="integration.caldav.shareIntroduction" />
                      </p>
                      {(!props.caldavCalendars || props.caldavCalendars.length === 0) && (
                        <p class="alert alert-info">
                          <Text id="integration.caldav.synchronizationNeeded" />
                        </p>
                      )}
                      {props.caldavCalendars && props.caldavCalendars.length > 0 && (
                        <div class="form-group">
                          <div className={style.switchGroup}>
                            {props.caldavCalendars &&
                              props.caldavCalendars.map(calendar => {
                                return (
                                  <label class={cx('custom-switch', style.switchLabel)}>
                                    <input
                                      type="checkbox"
                                      name={calendar.selector}
                                      class="custom-switch-input"
                                      checked={
                                        props.calendarsSharing
                                          ? props.calendarsSharing[calendar.selector]
                                          : calendar.shared
                                      }
                                      onClick={props.updateCalendarSharing}
                                    />
                                    <span class={cx('custom-switch-indicator', style.switchIndicator)} />
                                    {calendar.name}
                                  </label>
                                );
                              })}
                          </div>
                          {props.caldavSaveSharingStatus === CalDAVStatus.Error && (
                            <div class="alert alert-danger">
                              <Text id="integration.caldav.calendarChoiceError" />
                            </div>
                          )}
                          {props.caldavSaveSharingStatus === CalDAVStatus.Success && (
                            <p class="alert alert-info">
                              <Text id="integration.caldav.calendarChoiceSuccess" />
                            </p>
                          )}
                          <span class="input-group-append">
                            <button
                              class="btn btn-primary"
                              onClick={props.saveCaldavSettings}
                              disabled={!props.calendarsSharing}
                            >
                              <Text id={`integration.caldav.buttonSave`} />
                            </button>
                          </span>
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
  </div>
);

export default ShareTab;
