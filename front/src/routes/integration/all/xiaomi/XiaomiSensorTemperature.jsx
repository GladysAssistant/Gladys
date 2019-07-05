import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import XiaomiSensorTemperatureBox from './XiaomiSensorTemperatureBox';
import { RequestStatus } from '../../../../utils/consts';
import style from './style.css';

const XiaomiSensorTemperature = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-12">
              <div class="card">
                <div class="card-header">
                  <h1 class="card-title">
                    <Text id="integration.xiaomi.title" />
                  </h1>
                </div>
                <card-body>
                  <div class={cx('dimmer-content', style.xiaomiListBody)}>
                    <div class="row my-4 mx-2">
                      {props.xiaomiSensorTemperature &&
                        props.xiaomiSensorTemperature.map((sensor, index) => (
                          <XiaomiSensorTemperatureBox
                            sensor={sensor}
                            sensorIndex={index}
                            updateSensorField={props.updateSensorField}
                            updateNameFeature={props.updateNameFeature}
                            saveSensor={props.saveSensor}
                            houses={props.houses}
                          />
                        ))}
                      {props.xiaomiSensorTemperature && props.xiaomiSensorTemperature.length === 0 && (
                        <div class="col-md-12">
                          <div class={cx('text-center', style.emptyStateDivBox)}>
                            <Text id="integration.xiaomi.noSensorFound" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </card-body>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default XiaomiSensorTemperature;
