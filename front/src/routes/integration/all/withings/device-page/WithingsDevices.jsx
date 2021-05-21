import { Text } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import Device from './Device';
import style from './style.css';

const WithingsDevices = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-12">
              <div class="card">
                <div class="card-body">
                  <div
                    class={cx('dimmer', {
                      active: props.loading
                    })}
                  >
                    <div class="loader" />
                    <div class="dimmer-content">
                      <h2>
                        <Text id="integration.withings.device.title" />
                      </h2>
                      <div class="card-body">
                        <div
                          class={cx('dimmer', {
                            active: props.withingsGetStatus === RequestStatus.Getting
                          })}
                        >
                          <div class="loader" />
                          <div class="dimmer-content">
                            {props.withingsDevices && props.withingsDevices.length === 0 && (
                              <div class="alert alert-info">
                                <Text id="integration.withings.device.noDevices" />
                              </div>
                            )}
                            {props.withingsGetStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
                            <div class="row">
                              {props.withingsDevices &&
                                props.withingsDevices.map((withingsDevice, index) => (
                                  <Device
                                    device={withingsDevice}
                                    withingsImgMap={props.withingsImgMap}
                                    deviceIndex={index}
                                    houses={props.houses}
                                    updateDeviceProperty={props.updateDeviceProperty}
                                    saveDevice={props.saveDevice}
                                    user={props.user}
                                  />
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default WithingsDevices;
