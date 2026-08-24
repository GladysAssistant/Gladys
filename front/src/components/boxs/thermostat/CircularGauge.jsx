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
  snowflake: '\ue165'
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

const CircularGauge = ({
  setpoint,
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
  a11yLabels = {}
}) => {
  const cx = 110;
  const cy = 110;
  const r = 88;
  const sw = 11;
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
  // Derive both halves from one rounded value: splitting the raw setpoint made
  // 20.96 render as "20.10" (the decimal carried to 10) and -3.5 as "-4.5"
  // (floor rounds away from zero for negatives).
  const roundedSetpoint = Math.round(setpoint * 10) / 10;
  const truncated = Math.trunc(roundedSetpoint);
  const decPart = Math.round(Math.abs(roundedSetpoint - truncated) * 10);
  // Math.trunc(-0.5) is -0, which renders as "0": a setpoint between -1 and 0
  // would lose its sign, so the minus is restored explicitly.
  const intPart = truncated === 0 && roundedSetpoint < 0 ? '-0' : String(truncated);
  const intW = intPart.length * 30;
  const intX = cx - intW / 2 - 18;
  const suffixX = intX + intW;

  const hasCurrentTemp = currentTemp !== null && currentTemp !== undefined;
  const hasHumidity = humidity !== null && humidity !== undefined;

  // One sentence for a screen reader, instead of the raw SVG texts being read
  // one fragment at a time ("21", ".0", "\u00b0", "C"). The individual <text>
  // nodes are hidden from the tree for the same reason.
  const unit = `\u00b0${tempUnit || 'C'}`;
  const label = [
    `${a11yLabels.setpoint || 'Setpoint'} ${roundedSetpoint} ${unit}`,
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

  const interactive = !!(onIncrement || onDecrement || onPointerDown);

  return (
    <svg
      viewBox="0 0 220 220"
      class={style.gaugeSvg}
      onPointerDown={onPointerDown}
      onKeyDown={interactive ? onKeyDown : undefined}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'slider' : 'img'}
      aria-label={label}
      aria-valuemin={interactive ? minTemp : undefined}
      aria-valuemax={interactive ? maxTemp : undefined}
      aria-valuenow={interactive ? roundedSetpoint : undefined}
      aria-valuetext={interactive ? `${roundedSetpoint} ${unit}` : undefined}
    >
      <path class={style.gaugeArc} d={bgPath} fill="none" stroke="#e9ecef" strokeWidth={sw} strokeLinecap="round" />
      {/* The glow marks "running right now", which is just as true of a running
          air conditioner as of a running heater, so it applies in both modes.
          It is a drop-shadow rather than a feGaussianBlur/feMerge filter: merging
          a blurred copy under the stroke softens the stroke's own edges, which on
          this pale background turned the blue arc into a grey smear. A shadow
          leaves the stroke untouched and only casts colour around it. */}
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
      <circle class={style.gaugeArc} cx={knob.x} cy={knob.y} r="9" fill="white" stroke={arcColor} strokeWidth="2.5" />

      {/* Current temp + humidity: above setpoint */}
      {hasCurrentTemp && (
        <text
          aria-hidden="true"
          x={cx}
          y={hasHumidity ? cy - 46 : cy - 38}
          textAnchor="middle"
          dominantBaseline="middle"
          class={style.currentTempText}
        >
          {Number(currentTemp).toFixed(1)} °{tempUnit || 'C'}
        </text>
      )}
      {hasHumidity && (
        <text
          aria-hidden="true"
          x={cx}
          y={hasCurrentTemp ? cy - 28 : cy - 38}
          textAnchor="middle"
          dominantBaseline="middle"
          class={style.humidityText}
        >
          <tspan class={`${style.gaugeIconGlyph} ${style.humidityIcon}`}>{ICONS.droplet}</tspan>
          {` ${Math.round(humidity)} %`}
        </text>
      )}

      {/* Setpoint: integer + decimal + unit split (° above dot, C above decimal) */}
      <text aria-hidden="true" x={intX} y={cy + 25} textAnchor="start" dominantBaseline="auto" class={style.tempMain}>
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
      {onIncrement && (
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
      {onDecrement && (
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
