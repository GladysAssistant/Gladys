import { useEffect, useRef, useState } from 'preact/hooks';
import style from './style.css';

// The gauge is drawn as an SVG arc spanning ARC_DEGREES, opening at the bottom:
// it starts at ARC_START_ANGLE (150°, lower-left) and sweeps clockwise.
export const ARC_DEGREES = 240;
export const ARC_START_ANGLE = 150;

// Feather/Lucide glyphs, by codepoint. Native emoji render differently on every
// OS — and at different sizes — where the rest of Gladys draws its icons from
// this font; SVG <text> cannot use the `fe fe-*` classes, which work through a
// :before pseudo-element, so the codepoints are inlined here.
const ICONS = {
  droplet: '\ue0b4',
  flame: '\ue0d2',
  snowflake: '\ue165',
  thermometer: '\ue186'
};

/**
 * Convert a polar coordinate (angle in degrees, 0 = 12 o'clock) to cartesian.
 */
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? '1' : '0';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

// How long the arc takes to travel to a new setpoint. Long enough to be seen
// going up or down, short enough that a preset still feels applied at once.
const SETPOINT_ANIMATION_MS = 450;

const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

// One query for every gauge, created on first use: its `matches` follows the
// system setting live, and evaluating a new one on each render ran it about 27
// times per animation per gauge.
let reducedMotionQuery = null;
const prefersReducedMotion = () => {
  if (reducedMotionQuery === null) {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  }
  return reducedMotionQuery.matches;
};

// The step a setpoint is set in, from the widget's + and − buttons, in the unit
// the gauge is drawn in.
const SETPOINT_STEP = 0.5;

/**
 * The setpoint the gauge draws, travelling to a new value instead of jumping to
 * it: a preset picked, a hold expiring or a scene writing the setpoint moved the
 * arc from one temperature to the other in a single frame.
 *
 * A new target mid-way starts from where the arc is, so a burst of + clicks is
 * one continuous movement. Nothing is animated while `animate` is false — the
 * dial being dragged must stay under the finger — nor for a user who asked the
 * system for less motion, nor from or to a value that is not a number.
 *
 * When there is nothing to animate, the target is returned on the very render
 * that carries it: applied only in the effect, after paint, the knob drew the
 * previous temperature first and trailed the finger by a frame on every move.
 * The value drawn lives in a ref, read on every render; the state is only what
 * asks for the next frame. A skipped change therefore costs no second render:
 * setting the state there drew the gauge twice on every move of a drag.
 * @param {number} target - The setpoint to show.
 * @param {boolean} animate - Whether a change may be animated.
 * @returns {number} The setpoint to draw on this render.
 * @example
 * const shown = useAnimatedValue(setpoint, !isDragging);
 */
const useAnimatedValue = (target, animate) => {
  const [, setFrame] = useState(0);
  const shownRef = useRef(target);
  const frameRef = useRef(null);
  const skip = !animate || !Number.isFinite(target) || !Number.isFinite(shownRef.current) || prefersReducedMotion();

  useEffect(() => {
    const from = shownRef.current;
    const show = next => {
      shownRef.current = next;
      setFrame(frame => frame + 1);
    };
    // Already drawn by the render that carries it, which also left the ref there.
    if (skip || from === target) {
      return undefined;
    }
    const start = Date.now();
    const step = () => {
      const progress = Math.min(1, (Date.now() - start) / SETPOINT_ANIMATION_MS);
      show(progress === 1 ? target : from + (target - from) * easeOutCubic(progress));
      frameRef.current = progress === 1 ? null : requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [target, animate]);

  if (skip) {
    // The next animation starts from the finger, not from a frame interpolated
    // before the drag began, and the release draws where the finger left it.
    shownRef.current = target;
    return target;
  }
  return shownRef.current;
};

const CircularGauge = ({
  setpoint: targetSetpoint,
  animate = true,
  currentTemp,
  humidity,
  onPointerDown,
  onIncrement,
  onDecrement,
  minTemp,
  maxTemp,
  mode,
  isActive,
  isWindowOpen,
  tempUnit,
  step = SETPOINT_STEP,
  // A thermostat with no setpoint to offer — a pilot-wire heater regulating
  // itself. The gauge then draws no setpoint arc, no knob, takes no input, and
  // shows the room temperature in the middle, where the setpoint would be.
  readOnly = false,
  // The colour the whole ring takes when read-only: the order the heater
  // carries, so the dial says what it is doing rather than staying empty.
  ringColor = null,
  a11yLabels = {}
}) => {
  const cx = 110;
  const cy = 110;
  const r = 88;
  const sw = 11;
  const setpoint = useAnimatedValue(targetSetpoint, animate);
  const range = maxTemp - minTemp;
  const pct = range === 0 ? 0.5 : Math.min(1, Math.max(0, (setpoint - minTemp) / range));
  const arcEnd = ARC_START_ANGLE + Math.max(pct, 0.001) * ARC_DEGREES;
  const bgPath = describeArc(cx, cy, r, ARC_START_ANGLE, ARC_START_ANGLE + ARC_DEGREES);
  const fgPath = describeArc(cx, cy, r, ARC_START_ANGLE, arcEnd);
  const knob = polarToCartesian(cx, cy, r, arcEnd);
  // An open window suspends the heating, so the arc goes grey like the off mode:
  // leaving it orange showed a thermostat calling for heat while the switch was
  // being held off, which is the one thing the gauge must not misreport.
  const baseArcColor = mode === 'cooling' ? '#3b82f6' : mode === 'off' ? '#adb5bd' : '#f97316';
  const arcColor = isWindowOpen ? '#adb5bd' : baseArcColor;
  const hasCurrentTemp = currentTemp !== null && currentTemp !== undefined;
  const hasHumidity = humidity !== null && humidity !== undefined;
  // The big number: the setpoint, or the room temperature on a read-only gauge.
  const shownValue = readOnly ? Number(currentTemp) : setpoint;
  // Derive both halves from one rounded value: splitting the raw setpoint made
  // 20.96 render as "20.10" (the decimal carried to 10) and -3.5 as "-4.5"
  // (floor rounds away from zero for negatives).
  // On its way, the number counts in the step a setpoint is set in: 21.1 to
  // 21.4 on one + tap, and forty tenths on a preset change, were values the user
  // can never set. The arc and the knob glide; the number lands on the target.
  // The steps are counted back from the target rather than from zero: a 0.5 °C
  // step drawn in °F is 0.9 °F, whose multiples (70.2, 71.1) are not the values
  // the user sets either, and the count started backwards (70.7 → 70.5 → 71.0).
  // A read-only gauge shows the room temperature, which does not travel.
  const displayed =
    readOnly || setpoint === targetSetpoint
      ? shownValue
      : targetSetpoint + Math.round((setpoint - targetSetpoint) / step) * step;
  const roundedSetpoint = Math.round(displayed * 10) / 10;
  const truncated = Math.trunc(roundedSetpoint);
  const decPart = Math.round(Math.abs(roundedSetpoint - truncated) * 10);
  // Math.trunc(-0.5) is -0, which renders as "0": a setpoint between -1 and 0
  // would lose its sign, so the minus is restored explicitly.
  const intPart = truncated === 0 && roundedSetpoint < 0 ? '-0' : String(truncated);
  // What a screen reader announces is where the setpoint is going, not the
  // frames of the arc on its way there.
  const roundedTarget = Math.round(targetSetpoint * 10) / 10;
  const intW = intPart.length * 30;
  // Read-only, a thermometer sits left of the number to say it is the room's:
  // the whole group shifts right by half its width to stay centred.
  const intX = cx - intW / 2 - 18 + (readOnly ? 12 : 0);
  const suffixX = intX + intW;

  // A stopped thermostat has no setpoint to show. The number the gauge would
  // otherwise draw is the frost-protection fallback the server writes to stop a
  // real device — 7 °C under a lit Off button reads as "it is aiming at 7 °C",
  // which is the opposite of what the user asked for. The word takes its place,
  // and the arc keeps showing where that fallback sits.
  const isOff = mode === 'off';
  const offLabel = a11yLabels.off || 'Off';
  const hasSetpoint = !readOnly;
  // The word in the middle, when there is no number to draw there.
  let centerWord = null;
  if (isOff) {
    centerWord = offLabel;
  } else if (readOnly && !hasCurrentTemp) {
    centerWord = '—';
  }

  // One sentence for a screen reader, instead of the raw SVG texts being read
  // one fragment at a time ("21", ".0", "\u00b0", "C"). The individual <text>
  // nodes are hidden from the tree for the same reason.
  const unit = `\u00b0${tempUnit || 'C'}`;
  const label = [
    centerWord || (readOnly ? null : `${a11yLabels.setpoint || 'Setpoint'} ${roundedTarget} ${unit}`),
    hasCurrentTemp
      ? `${a11yLabels.currentTemp || 'Current temperature'} ${Number(currentTemp).toFixed(1)} ${unit}`
      : null,
    hasHumidity ? `${a11yLabels.humidity || 'Humidity'} ${Math.round(humidity)} %` : null,
    isWindowOpen ? a11yLabels.windowOpen || null : null
  ]
    .filter(Boolean)
    .join(', ');

  // Arrow keys move the setpoint, which is what role="slider" promises. Without
  // this the dial is the only way to set a temperature, and a dial cannot be
  // operated from a keyboard at all.
  const onKeyDown = event => {
    if (!onIncrement && !onDecrement) {
      return;
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
      event.preventDefault();
      if (onIncrement) onIncrement();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
      event.preventDefault();
      if (onDecrement) onDecrement();
    }
  };

  const interactive = hasSetpoint && !!(onIncrement || onDecrement || onPointerDown);

  return (
    <svg
      viewBox="0 0 220 220"
      class={style.gaugeSvg}
      onPointerDown={interactive ? onPointerDown : undefined}
      onKeyDown={interactive ? onKeyDown : undefined}
      tabindex={interactive ? '0' : undefined}
      role={interactive ? 'slider' : 'img'}
      aria-label={label}
      aria-valuemin={interactive ? minTemp : undefined}
      aria-valuemax={interactive ? maxTemp : undefined}
      aria-valuenow={interactive ? roundedTarget : undefined}
      aria-valuetext={interactive ? (isOff ? offLabel : `${roundedTarget} ${unit}`) : undefined}
    >
      {/* The track's colour lives in the stylesheet rather than here: inverted by
          the dark theme, #e9ecef came back as a near-black that vanished into the
          card, so it needs a value of its own there. */}
      {/* With no setpoint to turn, the gap at the bottom of the dial — where its
          range starts and ends — means nothing: the ring is drawn whole. */}
      {hasSetpoint ? (
        <path class={style.gaugeTrack} d={bgPath} fill="none" strokeWidth={sw} strokeLinecap="round" />
      ) : (
        <circle class={style.gaugeTrack} cx={cx} cy={cy} r={r} fill="none" strokeWidth={sw} />
      )}
      {/* The glow marks "running right now", which is just as true of a running
          air conditioner as of a running heater, so it applies in both modes.
          It is a drop-shadow rather than a feGaussianBlur/feMerge filter: merging
          a blurred copy under the stroke softens the stroke's own edges, which on
          this pale background turned the blue arc into a grey smear. A shadow
          leaves the stroke untouched and only casts colour around it. */}
      {hasSetpoint && (
        <path
          key={`${mode}-${arcColor}`}
          class={isActive ? `${style.arcGlow} ${style.gaugeArc}` : style.gaugeArc}
          style={isActive ? `color:${arcColor}` : undefined}
          d={fgPath}
          fill="none"
          stroke={arcColor}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      )}
      {hasSetpoint && (
        <circle class={style.gaugeArc} cx={knob.x} cy={knob.y} r="9" fill="white" stroke={arcColor} strokeWidth="2.5" />
      )}
      {/* No setpoint to mark: the whole ring takes the colour of the order. */}
      {readOnly && ringColor && (
        <circle class={style.gaugeArc} cx={cx} cy={cy} r={r} fill="none" stroke={ringColor} strokeWidth={sw} />
      )}

      {/* Read-only, the room temperature is the big number: a thermometer at
          its left, sized to it, says so. Alone above the humidity it read as a
          stray glyph. */}
      {readOnly && hasCurrentTemp && !isOff && (
        <text
          aria-hidden="true"
          x={intX - 4}
          y={cy + 12}
          textAnchor="end"
          dominantBaseline="middle"
          class={`${style.gaugeIconGlyph} ${style.roomTempIcon}`}
        >
          {ICONS.thermometer}
        </text>
      )}

      {/* Current temp + humidity: above setpoint */}
      {hasCurrentTemp && (!readOnly || isOff) && (
        <text
          aria-hidden="true"
          x={cx}
          y={hasHumidity ? cy - 46 : cy - 38}
          textAnchor="middle"
          dominantBaseline="middle"
          class={style.currentTempText}
        >
          {/* A thermometer in front of it: two bare numbers, the room and the
              setpoint, could be read for one another. The humidity below already
              carries its droplet, so this makes all three readings self-labelling
              without a word of text in a gauge that has no room for one. */}
          {/* Raised like the droplet below, by its own measured offset: the glyph
              sits about 1.3px low at 16px. */}
          <tspan class={`${style.gaugeIconGlyph} ${style.currentTempIcon}`} dy="-0.08em">
            {ICONS.thermometer}
          </tspan>
          <tspan dy="0.08em">{` ${Number(currentTemp).toFixed(1)} °${tempUnit || 'C'}`}</tspan>
        </text>
      )}
      {hasHumidity && (
        <text
          aria-hidden="true"
          x={cx}
          y={hasCurrentTemp && (!readOnly || isOff) ? cy - 28 : cy - 38}
          textAnchor="middle"
          dominantBaseline="middle"
          class={style.humidityText}
        >
          {/* The lucide droplet sits low on the text's baseline, its middle about
              2px under the middle of "62 %" at 13px: raised by that much, and the
              reading brought back down to where it was. */}
          <tspan class={`${style.gaugeIconGlyph} ${style.humidityIcon}`} dy="-0.15em">
            {ICONS.droplet}
          </tspan>
          <tspan dy="0.15em">{` ${Math.round(humidity)} %`}</tspan>
        </text>
      )}

      {/* Setpoint: integer + decimal + unit split (° above dot, C above decimal),
          replaced by the word "off" when the thermostat is stopped. */}
      {centerWord && (
        <text aria-hidden="true" x={cx} y={cy + 18} textAnchor="middle" dominantBaseline="auto" class={style.offText}>
          {centerWord}
        </text>
      )}
      {!centerWord && (
        <g>
          <text
            aria-hidden="true"
            x={intX}
            y={cy + 25}
            textAnchor="start"
            dominantBaseline="auto"
            class={style.tempMain}
          >
            {intPart}
          </text>
          <text
            aria-hidden="true"
            x={suffixX - 2}
            y={cy + 25}
            textAnchor="start"
            dominantBaseline="auto"
            class={style.tempDecimal}
          >
            .{decPart}
          </text>
          <text
            aria-hidden="true"
            x={suffixX - 3}
            y={cy + 4}
            textAnchor="start"
            dominantBaseline="auto"
            class={style.tempUnit}
          >
            °
          </text>
          <text
            aria-hidden="true"
            x={suffixX + 4}
            y={cy + 4}
            textAnchor="start"
            dominantBaseline="auto"
            class={style.tempUnit}
          >
            {tempUnit || 'C'}
          </text>
        </g>
      )}

      {/* Active icon: at bottom of gauge */}
      {/* No icon for an open window: the icon font has no window glyph, and the
          state is already named by the banner under the gauge. */}
      {!isWindowOpen && isActive && mode === 'heating' && (
        <text
          aria-hidden="true"
          x={cx}
          y={cy + 54}
          textAnchor="middle"
          dominantBaseline="middle"
          class={`${style.activeIconHeating} ${style.gaugeIconGlyph}`}
        >
          {ICONS.flame}
        </text>
      )}
      {!isWindowOpen && isActive && mode === 'cooling' && (
        <text
          aria-hidden="true"
          x={cx}
          y={cy + 54}
          textAnchor="middle"
          dominantBaseline="middle"
          class={`${style.activeIconCooling} ${style.gaugeIconGlyph}`}
        >
          {ICONS.snowflake}
        </text>
      )}

      {/* The arrow keys on the slider cover the keyboard case, so these stay
          out of the tab order and out of the accessibility tree: exposing them
          as two more controls would make a reader announce three ways to change
          one value. They keep their pointer behaviour. */}
      {hasSetpoint && onIncrement && (
        <g onClick={onIncrement} onPointerDown={e => e.stopPropagation()} class={style.arcBtnGroup} aria-hidden="true">
          {/* Transparent and wider than the visible circle: the button keeps
              its 30px look while the tap area reaches the recommended size. */}
          <circle cx="180" cy="40" r="24" class={style.arcBtnHitArea} />
          <circle cx="180" cy="40" r="15" class={style.arcBtnCircle} />
          <text
            aria-hidden="true"
            x="180"
            y="40"
            textAnchor="middle"
            dominantBaseline="middle"
            class={style.arcBtnText}
          >
            +
          </text>
        </g>
      )}
      {hasSetpoint && onDecrement && (
        <g onClick={onDecrement} onPointerDown={e => e.stopPropagation()} class={style.arcBtnGroup} aria-hidden="true">
          <circle cx="180" cy="180" r="24" class={style.arcBtnHitArea} />
          <circle cx="180" cy="180" r="15" class={style.arcBtnCircle} />
          <text
            aria-hidden="true"
            x="180"
            y="180"
            textAnchor="middle"
            dominantBaseline="middle"
            class={style.arcBtnText}
          >
            −
          </text>
        </g>
      )}
    </svg>
  );
};

export default CircularGauge;
