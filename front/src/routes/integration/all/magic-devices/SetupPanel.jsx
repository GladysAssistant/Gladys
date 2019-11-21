import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../utils/consts';

const SetupTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.magicDevices.setup.title" />
      </h3>
    </div>
    <div class="card-body">
      <div class="alert alert-info">
        <MarkupText id="integration.magicDevices.setup.description" />
      </div>
      <div
        class={cx('dimmer', {
          active: props.getDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          <div class="row">
            <button onClick={props.scan} class="btn btn-success mr-2">
              <Text id="integration.common.buttons.refresh" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SetupTab;
