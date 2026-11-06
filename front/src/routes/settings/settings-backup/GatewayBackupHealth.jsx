import { Text } from 'preact-i18n';
import get from 'get-value';

const formatDate = (isoDate, language) => new Date(isoDate).toLocaleString(language);

// The backups have been failing: the admins were told in the chat (from the
// second failed night, then once a week), this banner is the passive side of
// it, there whenever the user looks at the backups page.
const GatewayBackupHealth = ({ backupHealth, user }) => {
  if (!backupHealth || !backupHealth.failing_since) {
    return null;
  }
  const language = get(user, 'language') || 'en';
  return (
    <div class="alert alert-warning" role="alert">
      <h4 class="alert-heading">
        <Text id="gatewayBackup.health.failingTitle" />
      </h4>
      <p class="mb-1">
        <Text
          id="gatewayBackup.health.failingSince"
          fields={{ date: formatDate(backupHealth.failing_since, language) }}
        />{' '}
        {backupHealth.last_success_at ? (
          <Text
            id="gatewayBackup.health.lastSuccess"
            fields={{ date: formatDate(backupHealth.last_success_at, language) }}
          />
        ) : (
          <Text id="gatewayBackup.health.noSuccessYet" />
        )}
      </p>
      {backupHealth.last_error && (
        <p class="mb-1">
          <Text id="gatewayBackup.health.lastError" fields={{ error: backupHealth.last_error }} />
        </p>
      )}
      <p class="mb-0">
        <Text id="gatewayBackup.health.retry" />
      </p>
    </div>
  );
};

export default GatewayBackupHealth;
