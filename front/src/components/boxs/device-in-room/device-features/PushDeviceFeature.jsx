import { Component } from 'preact';
import cx from 'classnames';
import { Text } from 'preact-i18n';
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
    return (
      <tr>
        <td>
          <i class="fe fe-circle" />
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
            <i class="fe fe-circle" /> <Text id="dashboard.boxes.devicesInRoom.pushButton" />
          </button>
        </td>
      </tr>
    );
  }
}

export default PushDeviceComponent;
