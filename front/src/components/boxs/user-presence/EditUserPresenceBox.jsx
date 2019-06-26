import { Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';

const UserPresenceBox = ({ children, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.user-presence">
    <Text id="dashboard.boxes.userPresence.description" />
  </BaseEditBox>
);

export default UserPresenceBox;
