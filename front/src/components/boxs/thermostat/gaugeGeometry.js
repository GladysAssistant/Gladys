import { ARC_DEGREES, ARC_START_ANGLE } from './CircularGauge';

// The gauge is drawn in a fixed 220x220 viewBox centered on (110, 110).
const VIEWBOX_SIZE = 220;
const VIEWBOX_CENTER = VIEWBOX_SIZE / 2;

/**
 * Pointer or touch position, as an angle in degrees clockwise from 12 o'clock.
 */
export const getAngleFromPointer = (e, svgEl) => {
  const rect = svgEl.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const x = ((clientX - rect.left) / rect.width) * VIEWBOX_SIZE - VIEWBOX_CENTER;
  const y = ((clientY - rect.top) / rect.height) * VIEWBOX_SIZE - VIEWBOX_CENTER;
  let angle = (Math.atan2(x, -y) * 180) / Math.PI;
  if (angle < 0) angle += 360;
  return angle;
};

/**
 * The arc does not close: angles in the gap belong to no temperature.
 */
export const isAngleInArc = angleDeg => {
  const norm = (((angleDeg - ARC_START_ANGLE) % 360) + 360) % 360;
  return norm <= ARC_DEGREES;
};

/**
 * Angle to setpoint, rounded to the half degree the widget steps by.
 * Angles falling in the gap snap to whichever end of the arc is closer.
 */
export const angleToTemp = (angleDeg, minTemp, maxTemp) => {
  let norm = (((angleDeg - ARC_START_ANGLE) % 360) + 360) % 360;
  if (norm > ARC_DEGREES) {
    norm = norm > ARC_DEGREES + (360 - ARC_DEGREES) / 2 ? 0 : ARC_DEGREES;
  }
  const temp = minTemp + (norm / ARC_DEGREES) * (maxTemp - minTemp);
  return Math.round(temp * 2) / 2;
};
