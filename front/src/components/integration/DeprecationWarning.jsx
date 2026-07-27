import { MarkupText } from 'preact-i18n';

// Built-in integrations being replaced by community external integrations
// (Tuya, MELCloud, Telegram, Netatmo...): both versions will co-exist in
// the catalog during the transition, so the situation is made explicit on
// the integration page itself, in addition to the catalog card badge.
const DeprecationWarning = () => (
  <div class="alert alert-warning">
    <i class="fe fe-alert-triangle mr-1" />
    <MarkupText id="integration.deprecationWarning" />
  </div>
);

export default DeprecationWarning;
