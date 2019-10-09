import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import style from './style.css';

const EmptyState = ({ children, ...props }) => (
  <div class="col-md-12">
    <div class={cx('text-center', style.emptyStateDivBox)}>
      <Text id="integration.sonoff.device.noDeviceFound" />
      <div class="row justify-content-center mt-4">
        <div>
          <Link href="/dashboard/integration/device/sonoff/discover">
            <button class="btn btn-outline-primary ml-2">
              <Text id="integration.sonoff.discoverTab" /> <i class="fe fe-radio" />
            </button>
          </Link>
        </div>
        <div>
          <button onClick={props.addDevice} class="btn btn-outline-primary ml-2">
            <Text id="integration.sonoff.device.newButton" /> <i class="fe fe-plus" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default EmptyState;
