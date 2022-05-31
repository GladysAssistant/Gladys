const spritePath = '/assets/icons/tabler-sprite-v1.68.0.svg';

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
    <use href={`${spritePath}#tabler-${icon}`} />
  </svg>
);

export default TablerIcon;
