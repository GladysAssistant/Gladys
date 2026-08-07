import { Text } from 'preact-i18n';
import cx from 'classnames';

import { ConfigField } from './ConfigSchemaForm';
import { RequestStatus } from '../../../../../utils/consts';

// Send-only notification channels (messaging.receive false): no inbound
// path, so no code-based link — each user (not only the admin) fills
// their OWN identity here (contact_schema values, ex. Free Mobile:
// username + access token), stored per user. An unconfigured user simply
// never receives anything; clearing the values is the revocation.
const ContactProfileCard = ({
  contactSchema,
  language,
  profile,
  values,
  configuredSecrets,
  touchedSecrets,
  profileStatus,
  updateValue,
  onSave,
  onClear
}) => {
  const working = profileStatus === RequestStatus.Getting;
  const configured = Boolean(profile && profile.configured);
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <i class="fe fe-user mr-1" />
          <Text id="integration.externalIntegration.contactProfile.title" />
        </h3>
      </div>
      <div class="card-body">
        <p class="text-muted small">
          <Text id="integration.externalIntegration.contactProfile.description" />
        </p>
        {profileStatus === RequestStatus.Error && (
          <div class="alert alert-danger">
            <Text id="integration.externalIntegration.contactProfile.saveError" />
          </div>
        )}
        {profileStatus === RequestStatus.Success && (
          <div class="alert alert-success">
            <Text id="integration.externalIntegration.contactProfile.saveSuccess" />
          </div>
        )}
        <form onSubmit={onSave}>
          {contactSchema.map(field => (
            <ConfigField
              key={field.key}
              field={field}
              language={language}
              values={values || {}}
              configuredSecrets={configuredSecrets || []}
              touchedSecrets={touchedSecrets || {}}
              updateConfigValue={updateValue}
            />
          ))}
          <div class="form-footer">
            <button type="submit" class={cx('btn btn-success', { 'btn-loading': working })} disabled={working}>
              <Text id="integration.externalIntegration.contactProfile.saveButton" />
            </button>
            {configured && (
              <button
                type="button"
                class={cx('btn btn-outline-danger ml-2', { 'btn-loading': working })}
                disabled={working}
                onClick={onClear}
              >
                <Text id="integration.externalIntegration.contactProfile.clearButton" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactProfileCard;
