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

  createSensor = async () => {};

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
            <h2>Not available now</h2>
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.xiaomi.setPassword" />
              </label>
              <input type="password" class="form-control" name="password-input-gateway" placeholder="Password.." />
            </div>
            <div class="form-group">
              <button onClick={this.createSensor} class="btn btn-success mr-2">
                <Text id="integration.xiaomi.saveButton" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default XiaomiSensor;
