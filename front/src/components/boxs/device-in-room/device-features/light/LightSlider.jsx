import { Component, createRef } from 'preact';
import cx from 'classnames';

import style from './style.css';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Kept in sync with .sliderThumb in style.css: the thumb travels inside the track instead of
// hanging over its rounded ends.
const THUMB_SIZE = 34;
const THUMB_RADIUS = THUMB_SIZE / 2;

// Steps are counted from the minimum, not from zero: a color temperature running from 153 to 500
// would otherwise snap to multiples of the step and never reach its own bounds.
const roundToStep = (value, min, step) => min + Math.round((value - min) / step) * step;

/**
 * A big, finger-first slider. Two shapes:
 * - `vertical`: the HomeKit brightness bar — a tall rounded track filling from the bottom, the
 *   whole surface draggable, with the value written inside it;
 * - horizontal: a thick gradient track with a round thumb, for color temperature / hue / saturation.
 *
 * Both are one control: the pointer moves are tracked on `window` (no pointer capture, so a finger
 * leaving the track keeps dragging), and the track is a real `role="slider"` reachable at the
 * keyboard.
 */
class LightSlider extends Component {
  trackRef = createRef();

  // The drag is tracked on an instance field, not on the state: setState is asynchronous, so a
  // pointerup landing before the flush would read `dragging === false`, return early and leave the
  // window listeners attached — every later pointer move on the page would then write to the lamp.
  // The state only carries the CSS class.
  isDragging = false;

  state = { dragging: false };

  componentWillUnmount() {
    this.stopListening();
  }

  startListening = () => {
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
  };

  stopListening = () => {
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
  };

  getValueFromPointer = event => {
    const track = this.trackRef.current;
    const { min, max, step = 1, vertical, value } = this.props;
    if (!track) {
      return value;
    }
    const rect = track.getBoundingClientRect();
    // The vertical bar fills from the bottom, like a real dimmer: the top of the track is the max.
    const ratio = vertical ? 1 - (event.clientY - rect.top) / rect.height : (event.clientX - rect.left) / rect.width;
    const rawValue = min + clamp(ratio, 0, 1) * (max - min);
    return clamp(roundToStep(rawValue, min, step), min, max);
  };

  handlePointerDown = event => {
    // Keeps the browser from scrolling / text-selecting while the finger drags the slider.
    event.preventDefault();
    if (this.trackRef.current) {
      this.trackRef.current.focus();
    }
    this.isDragging = true;
    this.setState({ dragging: true });
    this.startListening();
    this.emitChange(this.getValueFromPointer(event));
  };

  handlePointerMove = event => {
    if (!this.isDragging) {
      return;
    }
    this.emitChange(this.getValueFromPointer(event));
  };

  handlePointerUp = event => {
    this.stopListening();
    if (!this.isDragging) {
      return;
    }
    this.isDragging = false;
    this.setState({ dragging: false });
    this.emitChange(this.getValueFromPointer(event));
  };

  handleKeyDown = event => {
    const { min, max, step = 1 } = this.props;
    const bigStep = Math.max(step, Math.round((max - min) / 10));
    let newValue;
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        newValue = this.currentValue() + step;
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        newValue = this.currentValue() - step;
        break;
      case 'PageUp':
        newValue = this.currentValue() + bigStep;
        break;
      case 'PageDown':
        newValue = this.currentValue() - bigStep;
        break;
      case 'Home':
        newValue = min;
        break;
      case 'End':
        newValue = max;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.emitChange(clamp(newValue, min, max));
  };

  currentValue = () => {
    const { value, min } = this.props;
    return Number.isFinite(value) ? value : min;
  };

  emitChange = value => {
    if (value !== this.currentValue()) {
      this.props.onChange(value);
    }
  };

  render(
    { min, max, vertical, label, valueText, trackBackground, fillBackground, neutralFill, children },
    { dragging }
  ) {
    const value = this.currentValue();
    const percent = max === min ? 0 : clamp(((value - min) / (max - min)) * 100, 0, 100);

    return (
      <div
        ref={this.trackRef}
        role="slider"
        tabIndex="0"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText}
        aria-orientation={vertical ? 'vertical' : 'horizontal'}
        onPointerDown={this.handlePointerDown}
        onKeyDown={this.handleKeyDown}
        class={cx(style.sliderTrack, {
          [style.sliderTrackVertical]: vertical,
          [style.sliderTrackHorizontal]: !vertical,
          [style.sliderDragging]: dragging
        })}
      >
        {/* The colors of a light are painted on their own layer: dark mode darkens the app with a
            global inversion filter, and these layers are the ones that must be inverted back so a
            warm white stays warm and the wheel keeps pointing at the right hue. */}
        {trackBackground && <div class={style.sliderTrackBackground} style={{ backgroundImage: trackBackground }} />}
        {vertical && (
          <div
            class={cx(style.sliderFill, { [style.sliderFillNeutral]: neutralFill })}
            style={{ height: `${percent}%`, backgroundImage: fillBackground }}
          />
        )}
        {!vertical && (
          <div
            class={style.sliderThumb}
            style={{ left: `calc(${THUMB_RADIUS}px + (100% - ${THUMB_SIZE}px) * ${percent / 100})` }}
          />
        )}
        {children && <div class={style.sliderContent}>{children}</div>}
      </div>
    );
  }
}

export default LightSlider;
