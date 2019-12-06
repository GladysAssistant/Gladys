import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';

const SetupTab = ({ children, ...props }) => {
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.netatmo.setting.title" />
        </h3>
      </div>
      <div class="card-body"></div>
    </div>
  );
};

export default SetupTab;
