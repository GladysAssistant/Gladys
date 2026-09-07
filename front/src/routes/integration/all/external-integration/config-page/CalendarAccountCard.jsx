import { Text } from 'preact-i18n';
import cx from 'classnames';

import { ConfigField } from './ConfigSchemaForm';
import { RequestStatus } from '../../../../../utils/consts';

// The per-user block of a calendar integration (spec B.19): every user — not
// only the admin — enables the integration for themselves, fills their own
// account values (account_schema), then manages their calendars with the
// sync/shared toggles. Disabling destroys their calendars, hence the
// explicit inline confirmation.
const CalendarAccountCard = ({
  accountSchema,
  language,
  account,
  values,
  touchedSecrets,
  accountStatus,
  disableConfirming,
  calendarToggleStatus,
  updateValue,
  onSave,
  onDisable,
  onDisableConfirm,
  onDisableCancel,
  onToggleCalendar
}) => {
  const working = accountStatus === RequestStatus.Getting;
  const enabled = Boolean(account && account.enabled);
  const calendars = (account && account.calendars) || [];
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <i class="fe fe-calendar mr-1" />
          <Text id="integration.externalIntegration.myCalendars.title" />
        </h3>
      </div>
      <div class="card-body">
        <p class="text-muted small">
          <Text id="integration.externalIntegration.myCalendars.description" />
        </p>
        {accountStatus === RequestStatus.Error && (
          <div class="alert alert-danger">
            <Text id="integration.externalIntegration.myCalendars.saveError" />
          </div>
        )}
        {accountStatus === RequestStatus.Success && (
          <div class="alert alert-success">
            <Text id="integration.externalIntegration.myCalendars.saveSuccess" />
          </div>
        )}
        <form onSubmit={onSave}>
          {accountSchema.map(field => (
            <ConfigField
              key={field.key}
              field={field}
              language={language}
              values={values || {}}
              configuredSecrets={(account && account.configured_secrets) || []}
              touchedSecrets={touchedSecrets || {}}
              updateConfigValue={updateValue}
            />
          ))}
          <div class="form-footer">
            <button type="submit" class={cx('btn btn-success', { 'btn-loading': working })} disabled={working}>
              {enabled ? (
                <Text id="integration.externalIntegration.myCalendars.saveButton" />
              ) : (
                <Text id="integration.externalIntegration.myCalendars.enableButton" />
              )}
            </button>
          </div>
        </form>

        {enabled && (
          <div class="mt-4">
            {calendars.length === 0 && (
              <p class="alert alert-info">
                <Text id="integration.externalIntegration.myCalendars.noCalendars" />
              </p>
            )}
            {calendars.map(calendar => (
              <div key={calendar.selector} class="mb-3">
                <div class="d-flex align-items-center">
                  <span
                    class="mr-2"
                    style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: calendar.color || '#3174ad'
                    }}
                  />
                  <strong>{calendar.name}</strong>
                </div>
                <div class="ml-4">
                  <label class="custom-switch">
                    <input
                      type="checkbox"
                      class="custom-switch-input"
                      checked={calendar.sync}
                      onClick={e => onToggleCalendar(calendar.selector, 'sync', e.target.checked)}
                      disabled={calendarToggleStatus === RequestStatus.Getting}
                    />
                    <span class="custom-switch-indicator" />
                    <span class="custom-switch-description">
                      <Text id="integration.externalIntegration.myCalendars.syncLabel" />
                    </span>
                  </label>
                  <label class="custom-switch d-block">
                    <input
                      type="checkbox"
                      class="custom-switch-input"
                      checked={calendar.shared}
                      onClick={e => onToggleCalendar(calendar.selector, 'shared', e.target.checked)}
                      disabled={calendarToggleStatus === RequestStatus.Getting}
                    />
                    <span class="custom-switch-indicator" />
                    <span class="custom-switch-description">
                      <Text id="integration.externalIntegration.myCalendars.sharedLabel" />
                    </span>
                  </label>
                  <small class="form-text text-muted">
                    <Text id="integration.externalIntegration.myCalendars.sharedHelp" />
                  </small>
                </div>
              </div>
            ))}

            {!disableConfirming && (
              <button
                type="button"
                class={cx('btn btn-outline-danger', { 'btn-loading': working })}
                disabled={working}
                onClick={onDisable}
              >
                <Text id="integration.externalIntegration.myCalendars.disableButton" />
              </button>
            )}
            {disableConfirming && (
              <div class="alert alert-danger">
                <p>
                  <Text id="integration.externalIntegration.myCalendars.disableConfirmText" />
                </p>
                <button
                  type="button"
                  class={cx('btn btn-danger mr-2', { 'btn-loading': working })}
                  disabled={working}
                  onClick={onDisableConfirm}
                >
                  <Text id="integration.externalIntegration.myCalendars.disableConfirmButton" />
                </button>
                <button type="button" class="btn btn-secondary" disabled={working} onClick={onDisableCancel}>
                  <Text id="integration.externalIntegration.myCalendars.cancelButton" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarAccountCard;
