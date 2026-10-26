import { Component } from 'preact';
import { Localizer } from 'preact-i18n';
import cx from 'classnames';

import style from './MusicBox.css';

// The thumb of the invisible native input: the drawn fill and thumb use the same geometry so
// they sit exactly where the browser maps the pointer
const THUMB_SIZE_PX = 12;

// A thin player slider (progress and volume): the native range input stays on top, invisible, so
// pointer drag, touch, keyboard arrows and screen readers come for free; the track, the fill and
// the thumb underneath are drawn. `smoothStep` animates a small forward move (the ticking
// progress) instead of jumping, any bigger move (a seek, a new track) jumps at once.
class MusicSlider extends Component {
  render({ value, max, onInput, onChange, disabled, label, valueText, smoothStep, muted, className }) {
    const safeValue = Number.isFinite(value) ? value : 0;
    const previous = this.lastValue;
    this.lastValue = safeValue;
    const smooth =
      smoothStep > 0 && previous !== undefined && safeValue >= previous && safeValue - previous <= smoothStep;
    const ratio = max > 0 ? Math.min(1, Math.max(0, safeValue / max)) : 0;
    const offset = `calc(${ratio} * (100% - ${THUMB_SIZE_PX}px))`;
    return (
      <div
        class={cx(style.slider, className, {
          [style.sliderDisabled]: disabled,
          [style.sliderSmooth]: smooth,
          [style.sliderMuted]: muted
        })}
      >
        <div class={style.sliderTrack}>
          <div
            class={style.sliderFill}
            style={{ width: ratio > 0 ? `calc(${THUMB_SIZE_PX / 2}px + ${offset})` : '0px' }}
          />
        </div>
        {!disabled && <div class={style.sliderThumb} style={{ left: offset }} />}
        <Localizer>
          <input
            type="range"
            class={style.sliderInput}
            min="0"
            max={max}
            step="1"
            value={Math.round(safeValue)}
            onInput={onInput}
            onChange={onChange}
            disabled={disabled}
            aria-label={label}
            aria-valuetext={valueText}
          />
        </Localizer>
      </div>
    );
  }
}

export default MusicSlider;
