import { Text } from 'preact-i18n';
import cx from 'classnames';
import Select from 'react-select';
import { CalDAVStatus } from '../../../../../utils/consts';

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
                          <div style={{ marginBottom: '10px' }}>
                            {props.caldavCalendars &&
                              props.caldavCalendars.map(calendar => {
                                return (
                                  <label class="custom-switch" style={{ display: 'block', marginBottom: '10px' }}>
                                    {calendar.name}
                                    <Select
                                      name={calendar.selector}
                                      styles={{ menu: provided => ({ ...provided, zIndex: '100' }) }}
                                      defaultValue={[]}
                                      value={
                                        props.calendarsSharing?.hasOwnProperty(calendar.selector)
                                          ? props.gladysUsers.filter(u =>
                                              props.calendarsSharing[calendar.selector]?.split(',')?.includes(u.value)
                                            )
                                          : props.gladysUsers.filter(u =>
                                              calendar.shared_users?.split(',')?.includes(u.value)
                                            )
                                      }
                                      isMulti
                                      onChange={props.updateCalendarSharing}
                                      options={props.gladysUsers}
                                    />
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
