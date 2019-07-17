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
            <Text id="integration.xiaomi.title" />
          </h1>
        </div>
        <div class="card-body">
          <div class={cx('dimmer-content', style.xiaomiListBody)}>
            <div class="row my-4 mx-2">
              {props.xiaomiSensor &&
                props.xiaomiSensor.map((sensor, index) => (
                  <XiaomiSensorBox
                    sensor={sensor}
                    sensorIndex={index}
                    updateSensorField={props.updateSensorField}
                    updateNameFeature={props.updateNameFeature}
                    saveSensor={props.saveSensor}
                    deleteSensor={props.deleteSensor}
                    houses={props.houses}
                  />
                ))}
              {props.xiaomiSensor && props.xiaomiSensor.length === 0 && (
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
