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
class CameraMoveDeviceFeature extends Component {
  activeMove = null;

  pressMove = value => {
    if (this.activeMove !== null) {
      return;
    }
    this.activeMove = value;
    this.props.updateValue(this.props.deviceFeature, value);
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

  releaseMove = () => {
    if (this.activeMove === null) {
      return;
    }
    this.activeMove = null;
    this.props.updateValue(this.props.deviceFeature, CAMERA_MOVE.STOP);
  };

  stopAll = () => {
    this.activeMove = null;
    this.props.updateValue(this.props.deviceFeature, CAMERA_MOVE.STOP);
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
