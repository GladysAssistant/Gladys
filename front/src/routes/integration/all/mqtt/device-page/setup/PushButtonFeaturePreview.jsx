import { Text } from 'preact-i18n';
import cx from 'classnames';
import style from '../style.css';

const PushButtonFeaturePreview = ({ label }) => (
  <tr>
    <td>
      <i class="fe fe-circle" />
    </td>
    <td>{label}</td>
    <td class="text-right">
      <button type="button" class={cx('btn', 'btn-outline-success', 'btn-sm', style.catalogPushButton)} disabled>
        <i class="fe fe-circle" /> <Text id="dashboard.boxes.devicesInRoom.pushButton" />
      </button>
    </td>
  </tr>
);

export default PushButtonFeaturePreview;
