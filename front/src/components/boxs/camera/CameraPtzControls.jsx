import { Component } from 'preact';
import cx from 'classnames';
import { Localizer, Text } from 'preact-i18n';

import { CAMERA_MOVE } from '../../../../../server/utils/constants';
import { CAMERA_MOVE_OPTIONS, getSupportedMoves } from '../../../utils/cameraMove';
import style from './style.css';

const ZOOM_VALUES = [CAMERA_MOVE.ZOOM_IN, CAMERA_MOVE.ZOOM_OUT];

// PTZ overlay of the camera dashboard widget: D-pad + zoom + stop + preset select.
// Press-and-hold semantics (spec docs/specs/camera-ptz-control.md, A.2 and D.1): pressing a
// direction sends its CAMERA_MOVE value, releasing sends STOP (0). The integration-side
// watchdog bounds every move, so a lost release can never leave the camera rotating; the
// component still stops on unmount and when the tab is hidden, and retries a failed stop once.
class CameraPtzControls extends Component {
  state = {
    activeMove: null
  };

  sendValue = async (deviceFeature, value) => {
    await this.props.httpClient.post(`/api/v1/device_feature/${deviceFeature.selector}/value`, { value });
  };

  pressMove = async value => {
    if (this.state.activeMove !== null) {
      return;
    }
    this.setState({ activeMove: value });
    try {
      await this.sendValue(this.props.moveFeature, value);
    } catch (e) {
      console.error(e);
      this.setState({ activeMove: null });
    }
  };

  releaseMove = async () => {
    if (this.state.activeMove === null) {
      return;
    }
    this.setState({ activeMove: null });
    await this.sendStop();
  };

  stopAll = async () => {
    this.setState({ activeMove: null });
    await this.sendStop();
  };

  sendStop = async () => {
    try {
      await this.sendValue(this.props.moveFeature, CAMERA_MOVE.STOP);
    } catch (e) {
      console.error(e);
      try {
        await this.sendValue(this.props.moveFeature, CAMERA_MOVE.STOP);
      } catch (retryError) {
        console.error(retryError);
      }
    }
  };

  recallPreset = e => {
    const { value } = e.currentTarget;
    if (value === '') {
      return;
    }
    this.sendValue(this.props.presetFeature, Number(value)).catch(error => console.error(error));
    e.currentTarget.value = '';
  };

  handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      this.releaseMove();
    }
  };

  componentDidMount() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  componentWillUnmount() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    if (this.state.activeMove !== null && this.props.moveFeature) {
      this.sendValue(this.props.moveFeature, CAMERA_MOVE.STOP).catch(error => console.error(error));
    }
  }

  renderMoveButton(option, gridAreaClass) {
    return (
      <Localizer>
        <button
          type="button"
          class={cx('btn', style.ptzButton, gridAreaClass, {
            [style.ptzButtonActive]: this.state.activeMove === option.value
          })}
          aria-label={<Text id={`deviceFeatureAction.category.camera.move.${option.i18nKey}`} />}
          onPointerDown={() => this.pressMove(option.value)}
          onPointerUp={this.releaseMove}
          onPointerLeave={this.releaseMove}
          onPointerCancel={this.releaseMove}
          onContextMenu={e => e.preventDefault()}
        >
          <i class={`fe fe-${option.icon}`} />
        </button>
      </Localizer>
    );
  }

  render({ moveFeature, presetFeature }) {
    const supportedMoves = moveFeature ? getSupportedMoves(moveFeature) : [];
    const optionsByValue = new Map(CAMERA_MOVE_OPTIONS.map(option => [option.value, option]));
    const directionAreas = {
      [CAMERA_MOVE.TILT_UP]: style.ptzUp,
      [CAMERA_MOVE.PAN_LEFT]: style.ptzLeft,
      [CAMERA_MOVE.PAN_RIGHT]: style.ptzRight,
      [CAMERA_MOVE.TILT_DOWN]: style.ptzDown
    };
    const directionValues = Object.keys(directionAreas)
      .map(Number)
      .filter(value => supportedMoves.includes(value));
    const zoomValues = ZOOM_VALUES.filter(value => supportedMoves.includes(value));
    const presetOptions =
      presetFeature && Array.isArray(presetFeature.supported_options)
        ? [...presetFeature.supported_options].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        : [];

    return (
      <div class={style.ptzOverlay}>
        {moveFeature && directionValues.length > 0 && (
          <div class={style.ptzPad}>
            {directionValues.map(value => this.renderMoveButton(optionsByValue.get(value), directionAreas[value]))}
            <Localizer>
              <button
                type="button"
                class={cx('btn', style.ptzButton, style.ptzStop)}
                aria-label={<Text id="deviceFeatureAction.category.camera.move.stop" />}
                onClick={this.stopAll}
              >
                <i class="fe fe-square" />
              </button>
            </Localizer>
          </div>
        )}
        {moveFeature && zoomValues.length > 0 && (
          <div class={style.ptzZoom}>{zoomValues.map(value => this.renderMoveButton(optionsByValue.get(value)))}</div>
        )}
        {presetOptions.length > 0 && (
          <select value="" onChange={this.recallPreset} class={cx('form-control', 'form-control-sm', style.ptzPreset)}>
            <option value="">
              <Text id="dashboard.boxes.camera.presetPlaceholder" />
            </option>
            {presetOptions.map(option => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  }
}

export default CameraPtzControls;
