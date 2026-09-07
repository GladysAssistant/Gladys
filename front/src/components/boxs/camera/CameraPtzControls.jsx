import { Component } from 'preact';
import cx from 'classnames';
import { Localizer, Text } from 'preact-i18n';

import { CAMERA_MOVE } from '../../../../../server/utils/constants';
import { CAMERA_MOVE_OPTIONS, getSupportedMoves } from '../../../utils/cameraMove';
import style from './style.css';

const ZOOM_VALUES = [CAMERA_MOVE.ZOOM_IN, CAMERA_MOVE.ZOOM_OUT];

const isActivationKey = e => e.key === 'Enter' || e.key === ' ';

// PTZ overlay of the camera dashboard widget: D-pad + zoom + stop + preset select.
// Rendered on the live view only, anchored top-right so the native <video> controls at the
// bottom of the player stay usable (spec docs/specs/camera-ptz-control.md, D.1).
// Press-and-hold semantics (spec docs/specs/camera-ptz-control.md, A.2 and D.1): pressing a
// direction (pointer or Space/Enter) sends its CAMERA_MOVE value, releasing sends STOP (0).
// Each press opens a movement session bound to the feature it was sent to; the STOP is always
// queued AFTER the move request settles, so a fast release can never reach the server before
// the move, and a move whose response is lost still gets its STOP. The integration-side
// watchdog stays the last line of defense; the component also stops on unmount and when the
// tab is hidden, and retries a failed stop once.
class CameraPtzControls extends Component {
  state = {
    activeMove: null
  };

  moveSession = null;

  // Chain of standalone STOPs (stop button pressed with no movement in flight): each new STOP
  // and the next move are queued after it settles, so a stale STOP can never terminate a
  // movement started after it.
  pendingStop = null;

  sendValue = async (deviceFeature, value) => {
    await this.props.httpClient.post(`/api/v1/device_feature/${deviceFeature.selector}/value`, { value });
  };

  sendStop = async deviceFeature => {
    try {
      await this.sendValue(deviceFeature, CAMERA_MOVE.STOP);
    } catch (e) {
      console.error(e);
      try {
        await this.sendValue(deviceFeature, CAMERA_MOVE.STOP);
      } catch (retryError) {
        console.error(retryError);
      }
    }
  };

  pressMove = value => {
    if (this.moveSession) {
      return;
    }
    const session = { feature: this.props.moveFeature, stopQueued: false };
    const previousStop = this.pendingStop || Promise.resolve();
    session.movePromise = previousStop.then(() => this.sendValue(session.feature, value)).catch(e => console.error(e));
    this.moveSession = session;
    this.setState({ activeMove: value });
  };

  // Ends the current movement session: waits for the move request to settle, then sends STOP on
  // the SAME feature the move was sent to (a camera change mid-press must not stop another
  // camera). Always sends STOP, even when the move request failed — the request may have
  // reached the server with only its response lost.
  releaseMove = async () => {
    const session = this.moveSession;
    if (!session || session.stopQueued) {
      return;
    }
    session.stopQueued = true;
    this.setState({ activeMove: null });
    await session.movePromise;
    await this.sendStop(session.feature);
    this.moveSession = null;
  };

  stopAll = async () => {
    if (this.moveSession) {
      await this.releaseMove();
      return;
    }
    const previousStop = this.pendingStop || Promise.resolve();
    const stopPromise = previousStop.then(() => this.sendStop(this.props.moveFeature));
    this.pendingStop = stopPromise;
    await stopPromise;
    if (this.pendingStop === stopPromise) {
      this.pendingStop = null;
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

  handleMoveKeyDown = (e, value) => {
    if (!isActivationKey(e) || e.repeat) {
      return;
    }
    e.preventDefault();
    this.pressMove(value);
  };

  handleMoveKeyUp = e => {
    if (!isActivationKey(e)) {
      return;
    }
    e.preventDefault();
    this.releaseMove();
  };

  componentDidMount() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  componentWillUnmount() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.releaseMove();
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
          onKeyDown={e => this.handleMoveKeyDown(e, option.value)}
          onKeyUp={this.handleMoveKeyUp}
          onBlur={this.releaseMove}
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
        {/* Stop must stay reachable for zoom-only cameras too, so the pad renders (with its
            center stop button) as soon as any movement is supported */}
        {moveFeature && (directionValues.length > 0 || zoomValues.length > 0) && (
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
