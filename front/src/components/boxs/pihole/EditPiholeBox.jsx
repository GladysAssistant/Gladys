import { Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';

const PiholeBox = ({ children, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.pihole">
    <Text id="dashboard.boxes.pihole.description" />
  </BaseEditBox>
);

export default PiholeBox;
