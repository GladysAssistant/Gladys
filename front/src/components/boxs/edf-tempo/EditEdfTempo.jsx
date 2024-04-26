import { Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';

const EditEdfTempo = ({ ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.edf-tempo">
    <Text id="dashboard.boxes.edfTempo.description" />{' '}
    <div>
      <small>
        <a
          href="https://particulier.edf.fr/fr/accueil/gestion-contrat/options/tempo.html#/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Text id="dashboard.boxes.edfTempo.link" />
        </a>
      </small>
    </div>
  </BaseEditBox>
);

export default EditEdfTempo;
