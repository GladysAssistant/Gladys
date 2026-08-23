import style from './style.css';

// The gauge is drawn as an SVG arc spanning ARC_DEGREES, opening at the bottom:
// it starts at ARC_START_ANGLE (150°, lower-left) and sweeps clockwise.
export const ARC_DEGREES = 240;
export const ARC_START_ANGLE = 150;

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
  tempUnit
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
  const arcColor = mode === 'cooling' ? '#3b82f6' : mode === 'off' ? '#adb5bd' : '#f97316';
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

  return (
    <svg viewBox="0 0 220 220" class={style.gaugeSvg} onPointerDown={onPointerDown}>
      <path d={bgPath} fill="none" stroke="#e9ecef" strokeWidth={sw} strokeLinecap="round" />
      {/* The glow marks "running right now", which is just as true of a running
          air conditioner as of a running heater, so it applies in both modes.
          It is a drop-shadow rather than a feGaussianBlur/feMerge filter: merging
          a blurred copy under the stroke softens the stroke's own edges, which on
          this pale background turned the blue arc into a grey smear. A shadow
          leaves the stroke untouched and only casts colour around it. */}
      <path
        key={`${mode}-${arcColor}`}
        class={isActive ? style.arcGlow : undefined}
        style={isActive ? `color:${arcColor}` : undefined}
        d={fgPath}
        fill="none"
        stroke={arcColor}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <circle cx={knob.x} cy={knob.y} r="9" fill="white" stroke={arcColor} strokeWidth="2.5" />

      {/* Current temp + humidity: above setpoint */}
      {hasCurrentTemp && (
        <text
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
          x={cx}
          y={hasCurrentTemp ? cy - 28 : cy - 38}
          textAnchor="middle"
          dominantBaseline="middle"
          class={style.humidityText}
        >
          {`\u{1F4A7} ${Math.round(humidity)} %`}
        </text>
      )}

      {/* Setpoint: integer + decimal + unit split (° above dot, C above decimal) */}
      <text x={intX} y={cy + 25} textAnchor="start" dominantBaseline="auto" class={style.tempMain}>
        {intPart}
      </text>
      <text x={suffixX - 2} y={cy + 25} textAnchor="start" dominantBaseline="auto" class={style.tempDecimal}>
        .{decPart}
      </text>
      <text x={suffixX - 3} y={cy + 4} textAnchor="start" dominantBaseline="auto" class={style.tempUnit}>
        °
      </text>
      <text x={suffixX + 4} y={cy + 4} textAnchor="start" dominantBaseline="auto" class={style.tempUnit}>
        {tempUnit || 'C'}
      </text>

      {/* Active icon: at bottom of gauge */}
      {isWindowOpen && (
        <text x={cx} y={cy + 54} textAnchor="middle" dominantBaseline="middle" class={style.activeIconHeating}>
          🪟
        </text>
      )}
      {!isWindowOpen && isActive && mode === 'heating' && (
        <text x={cx} y={cy + 54} textAnchor="middle" dominantBaseline="middle" class={style.activeIconHeating}>
          🔥
        </text>
      )}
      {!isWindowOpen && isActive && mode === 'cooling' && (
        <text x={cx} y={cy + 54} textAnchor="middle" dominantBaseline="middle" class={style.activeIconCooling}>
          ❄️
        </text>
      )}

      {onIncrement && (
        <g onClick={onIncrement} onPointerDown={e => e.stopPropagation()} class={style.arcBtnGroup}>
          <circle cx="180" cy="40" r="15" class={style.arcBtnCircle} />
          <text x="180" y="40" textAnchor="middle" dominantBaseline="middle" class={style.arcBtnText}>
            +
          </text>
        </g>
      )}
      {onDecrement && (
        <g onClick={onDecrement} onPointerDown={e => e.stopPropagation()} class={style.arcBtnGroup}>
          <circle cx="180" cy="180" r="15" class={style.arcBtnCircle} />
          <text x="180" y="180" textAnchor="middle" dominantBaseline="middle" class={style.arcBtnText}>
            −
          </text>
        </g>
      )}
    </svg>
  );
};

export default CircularGauge;
