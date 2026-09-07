import { Component } from 'preact';
import get from 'get-value';
import { Localizer, Text } from 'preact-i18n';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { CAMERA_MOVE } from '../../../../../../server/utils/constants';
import { CAMERA_MOVE_OPTIONS, getSupportedMoves } from '../../../../utils/cameraMove';

const isActivationKey = e => e.key === 'Enter' || e.key === ' ';

// Press-and-hold camera movement row: pressing a button (pointer or Space/Enter) sends its
// CAMERA_MOVE value, releasing sends STOP (0). Integrations bound every move with a watchdog,
// so a press without a release stays safe (spec docs/specs/camera-ptz-control.md, A.2).
// Like the dashboard overlay, each press opens a movement session: STOP is only sent once the
// move request settled, so a quick tap can never get its STOP processed before its MOVE.
class CameraMoveDeviceFeature extends Component {
  moveSession = null;

  // Chain of standalone STOPs (stop button pressed with no movement in flight): each new STOP
  // and the next move are queued after it settles, so a stale STOP can never terminate a
  // movement started after it.
  pendingStop = null;

  sendValue = value =>
    Promise.resolve(this.props.updateValue(this.props.deviceFeature, value)).catch(e => console.error(e));

  pressMove = value => {
    if (this.moveSession) {
      return;
    }
    const session = { stopQueued: false };
    const previousStop = this.pendingStop || Promise.resolve();
    session.movePromise = previousStop.then(() => this.sendValue(value));
    this.moveSession = session;
  };

  handleKeyDown = (e, value) => {
    if (!isActivationKey(e) || e.repeat) {
      return;
    }
    e.preventDefault();
    this.pressMove(value);
  };

  handleKeyUp = e => {
    if (!isActivationKey(e)) {
      return;
    }
    e.preventDefault();
    this.releaseMove();
  };

  releaseMove = async () => {
    const session = this.moveSession;
    if (!session || session.stopQueued) {
      return;
    }
    session.stopQueued = true;
    await session.movePromise;
    await this.sendValue(CAMERA_MOVE.STOP);
    this.moveSession = null;
  };

  stopAll = async () => {
    if (this.moveSession) {
      await this.releaseMove();
      return;
    }
    const previousStop = this.pendingStop || Promise.resolve();
    const stopPromise = previousStop.then(() => this.sendValue(CAMERA_MOVE.STOP));
    this.pendingStop = stopPromise;
    await stopPromise;
    if (this.pendingStop === stopPromise) {
      this.pendingStop = null;
    }
  };

  componentWillUnmount() {
    this.releaseMove();
  }

  render(props) {
    const { category, type } = props.deviceFeature;
    const supportedMoves = getSupportedMoves(props.deviceFeature);
    const options = CAMERA_MOVE_OPTIONS.filter(option => supportedMoves.includes(option.value));

    return (
      <tr>
        <td>
          <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'move' })}`} />
        </td>
        <td>{props.rowName}</td>
        <td class="text-right py-0">
          <div class="btn-group" role="group">
            {options.map(option => (
              <Localizer key={option.value}>
                <button
                  type="button"
                  class="btn btn-sm btn-secondary"
                  aria-label={<Text id={`deviceFeatureAction.category.camera.move.${option.i18nKey}`} />}
                  onPointerDown={() => this.pressMove(option.value)}
                  onPointerUp={this.releaseMove}
                  onPointerLeave={this.releaseMove}
                  onPointerCancel={this.releaseMove}
                  onKeyDown={e => this.handleKeyDown(e, option.value)}
                  onKeyUp={this.handleKeyUp}
                  onBlur={this.releaseMove}
                  onContextMenu={e => e.preventDefault()}
                >
                  <i class={`fe fe-${option.icon}`} />
                </button>
              </Localizer>
            ))}
            <Localizer>
              <button
                type="button"
                class="btn btn-sm btn-secondary"
                aria-label={<Text id="deviceFeatureAction.category.camera.move.stop" />}
                onClick={this.stopAll}
              >
                <i class="fe fe-square" />
              </button>
            </Localizer>
          </div>
        </td>
      </tr>
    );
  }
}

export default CameraMoveDeviceFeature;
