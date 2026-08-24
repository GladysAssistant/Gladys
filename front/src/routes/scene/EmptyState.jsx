import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import style from './style.css';

// A small hand-drawn scene: a trigger card (the sun rises), a flow line, an
// action card (the lamp turns on) and a play badge. Inline SVG so it inverts
// with the theme in dark mode, like every other Horizon surface.
const FirstSceneIllustration = () => (
  <svg viewBox="0 0 260 150" class={style.emptyStateIllustration} aria-hidden="true">
    <ellipse cx="130" cy="122" rx="98" ry="16" fill="#e3ebfb" opacity="0.55" />
    {/* trigger card: the sun rises... */}
    <rect
      x="30"
      y="34"
      width="82"
      height="72"
      rx="16"
      fill="#ffffff"
      opacity="0.92"
      stroke="#dbe4f5"
      stroke-width="2"
    />
    <circle cx="58" cy="62" r="11" fill="#f5c04a" />
    <g stroke="#f5c04a" stroke-width="2.5" stroke-linecap="round">
      <line x1="58" y1="44" x2="58" y2="39" />
      <line x1="58" y1="80" x2="58" y2="85" />
      <line x1="40" y1="62" x2="35" y2="62" />
      <line x1="76" y1="62" x2="81" y2="62" />
      <line x1="45" y1="49" x2="42" y2="46" />
      <line x1="71" y1="75" x2="74" y2="78" />
      <line x1="71" y1="49" x2="74" y2="46" />
      <line x1="45" y1="75" x2="42" y2="78" />
    </g>
    <rect x="78" y="52" width="22" height="6" rx="3" fill="#dbe4f5" />
    <rect x="78" y="66" width="15" height="6" rx="3" fill="#e9eef8" />
    {/* ...so the scene flows... */}
    <path
      d="M 112 70 C 126 70, 134 70, 148 70"
      stroke="#3d6df0"
      stroke-width="2.5"
      stroke-dasharray="1 7"
      stroke-linecap="round"
      fill="none"
    />
    {/* ...and the lamp turns on */}
    <rect
      x="148"
      y="34"
      width="82"
      height="72"
      rx="16"
      fill="#ffffff"
      opacity="0.92"
      stroke="#dbe4f5"
      stroke-width="2"
    />
    <circle cx="189" cy="62" r="13" fill="#e3ebfb" stroke="#3d6df0" stroke-width="2.5" />
    <path d="M 184 74 h 10 v 5 a 3 3 0 0 1 -3 3 h -4 a 3 3 0 0 1 -3 -3 z" fill="#3d6df0" />
    <g stroke="#f5c04a" stroke-width="2.5" stroke-linecap="round">
      <line x1="189" y1="43" x2="189" y2="39" />
      <line x1="173" y1="53" x2="169" y2="51" />
      <line x1="205" y1="53" x2="209" y2="51" />
    </g>
    {/* a scene is something you run */}
    <circle cx="230" cy="40" r="14" fill="#3f8600" />
    <path d="M 226 33.5 l 10 6.5 l -10 6.5 z" fill="#ffffff" />
    {/* sparkles */}
    <path d="M 20 26 l 2.2 5 l 5 2.2 l -5 2.2 l -2.2 5 l -2.2 -5 l -5 -2.2 l 5 -2.2 z" fill="#f5c04a" />
    <path d="M 240 96 l 1.8 4 l 4 1.8 l -4 1.8 l -1.8 4 l -1.8 -4 l -4 -1.8 l 4 -1.8 z" fill="#3d6df0" opacity="0.7" />
    <path
      d="M 128 18 l 1.6 3.6 l 3.6 1.6 l -3.6 1.6 l -1.6 3.6 l -1.6 -3.6 l -3.6 -1.6 l 3.6 -1.6 z"
      fill="#3d6df0"
      opacity="0.5"
    />
  </svg>
);

// Empty states of the scene list. A search with no match keeps its context;
// a house without any scene yet gets a first mission instead of a dead end:
// create the first scene.
const EmptyState = ({ hasActiveFilters }) => {
  if (hasActiveFilters) {
    return (
      <div class={style.emptyStateCard}>
        <span class={style.emptySearchIcon}>
          <i class="fe fe-search" />
        </span>
        <h3 class={style.emptyStateTitle}>
          <Text id="scene.emptyState.noResultsTitle" />
        </h3>
        <p class={style.emptyStateText}>
          <Text id="scene.emptyState.noResultsText" />
        </p>
      </div>
    );
  }
  return (
    <div class={style.emptyStateCard}>
      <FirstSceneIllustration />
      <span class={style.missionChip}>
        <i class="fe fe-zap" /> <Text id="scene.emptyState.missionChip" />
      </span>
      <h3 class={style.emptyStateTitle}>
        <Text id="scene.emptyState.title" />
      </h3>
      <p class={style.emptyStateText}>
        <Text id="scene.emptyState.text" />
      </p>
      <Link href="/dashboard/scene/new" class={cx('btn', style.emptyStateButton)}>
        <i class="fe fe-plus" /> <Text id="scene.emptyState.createButton" />
      </Link>
    </div>
  );
};

export default EmptyState;
