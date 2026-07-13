// Reference the sprite by its public URL instead of importing it: in development,
// preact-cli inlines imported SVGs as data URIs and browsers refuse external
// <use> references on data URIs, which made these icons invisible in dev.
const ICON_SPRITE_URL = '/assets/icons/icon-sprite.svg';

const TablerIcon = ({ icon }) => (
  <svg
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <use href={`${ICON_SPRITE_URL}#${icon}`} />
  </svg>
);

export default TablerIcon;
