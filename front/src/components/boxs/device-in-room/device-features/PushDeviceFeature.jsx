import { Component } from 'preact';
import cx from 'classnames';
import get from 'get-value';
import { Text } from 'preact-i18n';
import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../server/utils/constants';
import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import style from './style.css';

// Television push buttons are remote-control keys: the row already names them ("Channel up",
// "Play", ...), so the button only shows the key icon. The generic "Push" label is kept for the
// button category, where the icon alone would not tell what pressing does.
const REMOTE_CONTROL_CATEGORIES = [DEVICE_FEATURE_CATEGORIES.TELEVISION];

class PushDeviceComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
    };
  }
  push = async () => {
    await this.setState({ loading: true });
    this.props.updateValue(this.props.deviceFeature, 1);
    setTimeout(() => {
      this.setState({ loading: false });
    }, 350);
  };

  render(props, { loading }) {
    const { category, type } = props.deviceFeature;
    const icon = get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'circle' });
    const iconOnly = REMOTE_CONTROL_CATEGORIES.includes(category);

    return (
      <tr>
        <td>
          <i class={`fe fe-${icon}`} />
        </td>
        <td>{props.rowName}</td>
        <td class="text-right">
          <button
            onClick={this.push}
            type="button"
            aria-label={iconOnly ? props.rowName : undefined}
            title={iconOnly ? props.rowName : undefined}
            class={cx('btn', 'btn-outline-success', 'btn-sm', style.btnLoading, {
              'btn-loading': loading,
            })}
          >
            <i class={`fe fe-${icon}`} />
            {!iconOnly && (
              <span>
                {' '}
                <Text id="dashboard.boxes.devicesInRoom.pushButton" />
              </span>
            )}
          </button>
        </td>
      </tr>
    );
  }
}

export default PushDeviceComponent;
