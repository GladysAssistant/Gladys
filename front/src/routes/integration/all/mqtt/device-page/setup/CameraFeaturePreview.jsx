import { Text } from 'preact-i18n';
import style from '../style.css';

const CAMERA_PREVIEW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6ba3d6"/>
      <stop offset="100%" stop-color="#c9d8e8"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8b7355"/>
      <stop offset="100%" stop-color="#5c4a35"/>
    </linearGradient>
  </defs>
  <rect width="400" height="225" fill="url(#sky)"/>
  <rect y="150" width="400" height="75" fill="url(#floor)"/>
  <rect x="40" y="95" width="120" height="90" fill="#4a6741" opacity="0.85"/>
  <rect x="250" y="70" width="110" height="115" fill="#5a7a9a" opacity="0.9"/>
  <rect x="180" y="120" width="55" height="65" fill="#7a6a55" opacity="0.9"/>
  <ellipse cx="200" cy="175" rx="35" ry="12" fill="rgba(0,0,0,0.15)"/>
  <circle cx="200" cy="158" r="18" fill="#d4a574"/>
  <rect x="0" y="210" width="400" height="15" fill="rgba(0,0,0,0.25)"/>
  <text x="12" y="22" fill="rgba(255,255,255,0.85)" font-family="sans-serif" font-size="11">LIVE</text>
  <circle cx="22" cy="18" r="4" fill="#e74c3c"/>
</svg>`;

const CAMERA_PREVIEW_IMAGE = `data:image/svg+xml,${encodeURIComponent(CAMERA_PREVIEW_SVG)}`;

const CameraFeaturePreview = ({ label }) => (
  <div class={style.cameraFeaturePreview}>
    <p class={style.cameraFeaturePreviewNotice}>
      <Text id="integration.mqtt.featureCatalog.cameraPreviewNotice" />
    </p>
    <div class={`card ${style.cameraFeaturePreviewCard}`}>
      <img class="card-img-top" src={CAMERA_PREVIEW_IMAGE} alt="" />
      <div class="card-header py-2 px-3">
        <h4 class="card-title mb-0 text-truncate">{label}</h4>
      </div>
    </div>
  </div>
);

export default CameraFeaturePreview;
