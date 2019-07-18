import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { Component } from 'preact';
import XiaomiSensorBox from './XiaomiSensorBox';
import { RequestStatus } from '../../../../../utils/consts';
import style from '../style.css';

class XiaomiSensor extends Component {
  constructor(props) {
    super(props);
    this.state = { selectSensor: null };
  }

  componentWillMount() {}

  updateSensorChoice = e => {
    this.setState({ selectSensor: e.target.value });
  };

  render(props, { loading, saveError, testConnectionError }) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.xiaomi.titleSetup" />
          </h1>
        </div>
        <div class="card-body">
          <div class={cx('dimmer-content', style.xiaomiListBody)}>
            <div class="row my-4 mx-2">
              {props.sensor &&
                props.sensor.map((xiaomiSensor, index) => (
                  <XiaomiSensorBox
                    sensor={xiaomiSensor}
                    sensorIndex={index}
                    updateSensorField={props.updateSensorField}
                    updateNameFeature={props.updateNameFeature}
                    addSensor={props.addSensor}
                    houses={props.houses}
                  />
                ))}
              {props.sensor && props.sensor.length === 0 && (
                <div class="col-md-12">
                  <div class={cx('text-center', style.emptyStateDivBox)}>
                    <Text id="integration.xiaomi.noSensorFound" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default XiaomiSensor;
