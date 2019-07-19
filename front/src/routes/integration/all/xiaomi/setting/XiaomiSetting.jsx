import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { Component } from 'preact';
import { RequestStatus } from '../../../../../utils/consts';
import style from '../style.css';

class XiaomiSensor extends Component {
  constructor(props) {
    super(props);
    this.state = { selectSensor: null };
  }

  componentWillMount() {}

  render(props, { loading, saveError, testConnectionError }) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.xiaomi.titleSetting" />
          </h1>
        </div>
        <div class="card-body">
          <div class={cx('dimmer-content', style.xiaomiListBody)}>
            <div class="row my-4 mx-2" />
          </div>
        </div>
      </div>
    );
  }
}

export default XiaomiSensor;
