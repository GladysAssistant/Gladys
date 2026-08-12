import { Text } from 'preact-i18n';
import cx from 'classnames';
import { CalDAVStatus } from '../../../../../utils/consts';

import style from './SyncTab.css';

const SyncTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.caldav.syncTab" />
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
            <Text id="integration.caldav.syncIntroduction" />
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
                          checked={props.calendarsToSync ? props.calendarsToSync[calendar.selector] : calendar.sync}
                          onClick={props.updateCalendarsToSync}
                        />
                        <span class={cx('custom-switch-indicator', style.switchIndicator)} />
                        {calendar.name}
                      </label>
                    );
                  })}
              </div>
              {props.caldavSaveSyncStatus === CalDAVStatus.Error && (
                <div class="alert alert-danger">
                  <Text id="integration.caldav.calendarChoiceError" />
                </div>
              )}
              {props.caldavSaveSyncStatus === CalDAVStatus.Success && (
                <p class="alert alert-info">
                  <Text id="integration.caldav.calendarChoiceSuccess" />
                </p>
              )}
              <span class="input-group-append">
                <button class="btn btn-primary" onClick={props.saveCaldavSettings} disabled={!props.calendarsToSync}>
                  <Text id={`integration.caldav.buttonSave`} />
                </button>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default SyncTab;
