import { Text } from 'preact-i18n';

const EditEcowatt = ({}) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <i class="fe fe-zap" />
        <span class="m-1">
          <Text id="dashboard.boxes.ecowatt.title" />
        </span>
      </h3>
    </div>
    <div class="card-body">
      <Text id="dashboard.boxes.ecowatt.description" />{' '}
      <small>
        <a href="https://www.monecowatt.fr/" target="_blank" rel="noopener noreferrer">
          <Text id="editScene.actionsCard.ecowattCondition.knowMore" />
        </a>
      </small>
    </div>
  </div>
);

export default EditEcowatt;
