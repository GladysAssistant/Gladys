import IconSprite from '/assets/icons/icon-sprite.svg';

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
    <use href={`${IconSprite}#${icon}`} />
  </svg>
);

export default TablerIcon;
