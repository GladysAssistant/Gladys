import cx from 'classnames';
import { Text } from 'preact-i18n';

const BatteryLevelFeature = ({ batteryLevel }) => (
  <div
    class={cx('tag', {
      'tag-green': batteryLevel >= 25,
      'tag-warning': batteryLevel < 25 && batteryLevel >= 10,
      'tag-danger': batteryLevel < 10
    })}
  >
    <Text id="global.percentValue" fields={{ value: batteryLevel }} />
    <span class="tag-addon">
      <i class="fe fe-battery" />
    </span>
  </div>
);

export default BatteryLevelFeature;
