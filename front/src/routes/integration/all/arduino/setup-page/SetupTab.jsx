import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';
import SetupDevice from './SetupDevice';

const SetupTab = ({ children, ...props }) => {
  return (
    <div>
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="integration.arduino.setup.title" />
          </h3>
          <div class="page-options d-flex">
            <button class="btn btn-info" onClick={props.getUsbPorts && props.checkConnected}>
              <Text id="integration.arduino.setup.refreshButton" />
            </button>
          </div>
            <button class="btn btn-outline-primary ml-2">
              <Text id="scene.newButton" /> <i class="fe fe-plus" />
            </button>
        </div>
        <SetupDevice/>
      </div>
    </div>

  );
};

export default SetupTab;
