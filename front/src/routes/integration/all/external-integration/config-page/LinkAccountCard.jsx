import { Text } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';

// Communication integrations: each user links/unlinks their OWN account.
// The generated code is the critical consent (single use, 15 minutes):
// the user sends it to the bot in the external channel, which calls the
// host API to complete the link.
const LinkAccountCard = ({ contact, linkCode, linkStatus, onGenerateCode, onUnlink }) => {
  const working = linkStatus === RequestStatus.Getting;
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.externalIntegration.link.title" />
        </h3>
      </div>
      <div class="card-body">
        {linkStatus === RequestStatus.Error && (
          <div class="alert alert-danger">
            <Text id="integration.externalIntegration.link.error" />
          </div>
        )}
        {contact && contact.linked ? (
          <div>
            <p>
              <i class="fe fe-check-circle mr-1 text-success" />
              <Text id="integration.externalIntegration.link.linkedText" />{' '}
              <strong>{contact.contact_name || contact.contact_id}</strong>
            </p>
            <button
              class={cx('btn btn-outline-danger', { 'btn-loading': working })}
              onClick={onUnlink}
              disabled={working}
            >
              <Text id="integration.externalIntegration.link.unlinkButton" />
            </button>
          </div>
        ) : (
          <div>
            <p class="text-muted">
              <Text id="integration.externalIntegration.link.notLinkedText" />
            </p>
            {linkCode && (
              <div class="alert alert-info">
                <Text id="integration.externalIntegration.link.codeText" /> <code>{linkCode}</code>
                <div class="small mt-1">
                  <Text id="integration.externalIntegration.link.codeExpiryText" />
                </div>
              </div>
            )}
            <button
              class={cx('btn btn-primary', { 'btn-loading': working })}
              onClick={onGenerateCode}
              disabled={working}
            >
              <i class="fe fe-link mr-1" />
              <Text id="integration.externalIntegration.link.generateCodeButton" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkAccountCard;
