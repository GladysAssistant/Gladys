import { Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';

const EditEcowatt = ({ ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.ecowatt">
    <Text id="dashboard.boxes.ecowatt.description" />{' '}
    <small>
      <a href="https://www.monecowatt.fr/" target="_blank" rel="noopener noreferrer">
        <Text id="editScene.actionsCard.ecowattCondition.knowMore" />
      </a>
    </small>
  </BaseEditBox>
);

export default EditEcowatt;
