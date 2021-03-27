import { Text } from 'preact-i18n';

const EmptyState = ({ children }) => (
  <div class="alert alert-info">
    <Text id="integration.broadlink.remote.noRemoteFound" />
  </div>
);

export default EmptyState;
