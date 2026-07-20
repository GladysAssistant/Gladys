import { Component } from 'preact';
import cx from 'classnames';
import get from 'get-value';
import { Text } from 'preact-i18n';
import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import style from './style.css';

class PushDeviceComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false
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
            class={cx('btn', 'btn-outline-success', 'btn-sm', style.btnLoading, {
              'btn-loading': loading
            })}
          >
            <i class={`fe fe-${icon}`} /> <Text id="dashboard.boxes.devicesInRoom.pushButton" />
          </button>
        </td>
      </tr>
    );
  }
}

export default PushDeviceComponent;
