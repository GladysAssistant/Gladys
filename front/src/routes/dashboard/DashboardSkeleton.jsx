import cx from 'classnames';
import style from './style.css';
import { getSectionWidths } from '../../utils/dashboardSections';

// A dashboard drawn from its stored configuration alone — no data fetched,
// nothing interactive. It exists for the mobile pager: while a swipe pulls
// the neighboring dashboard into view, this stands in for it so the gesture
// reveals a real page (the right columns, the right cards at roughly the
// right heights, the configured titles) instead of empty wallpaper. Heights
// are honest approximations: the skeleton is replaced in place by the live
// widgets the moment the switch commits, so it only has to hold the
// silhouette for the duration of the gesture.
const DEFAULT_BOX_HEIGHT = 140;
const BOX_SKELETON_HEIGHTS = {
  chart: 300,
  'energy-consumption': 320,
  gauge: 240,
  ecowatt: 200,
  weather: 180,
  camera: 240,
  photo: 240,
  'house-view': 260,
  music: 160,
  'edf-tempo': 150,
  'voice-assistant': 160,
  alarm: 110,
  scene: 100,
  link: 80,
  clock: 110,
  sun: 110,
  'temperature-in-room': 130,
  'humidity-in-room': 130,
  'user-presence': 130,
  actions: 110
};

// Row-list boxes: their height is how many features they show, and the box
// configuration says exactly that
const LIST_ROW_HEIGHT = 48;
const LIST_HEADER_HEIGHT = 56;

const getBoxHeight = box => {
  if (box.type === 'devices' || box.type === 'devices-in-room') {
    const rows = Array.isArray(box.device_features) && box.device_features.length > 0 ? box.device_features.length : 3;
    return LIST_HEADER_HEIGHT + rows * LIST_ROW_HEIGHT;
  }
  if (box.type === 'chart' && !box.display_axes) {
    // the compact sparkline variant is a low tile, not a full chart card
    return 150;
  }
  return BOX_SKELETON_HEIGHTS[box.type] || DEFAULT_BOX_HEIGHT;
};

// The configured title is the one piece of real content a skeleton can show
// (it lives in the box config, no fetch needed) — a named card reads as
// "your" page sliding in, where a gray bar reads as a placeholder
const getBoxTitle = box => {
  const title = [box.title, box.name].find(value => typeof value === 'string' && value.trim().length > 0);
  return title || null;
};

const SkeletonBox = ({ box }) => {
  // chips are bare pills on the wallpaper, not a card: a card-shaped
  // placeholder would morph into pills at the swap and give the trick away
  if (box.type === 'chips') {
    return (
      <div class={style.skeletonChipsRow}>
        {[0, 1, 2, 3].map(chip => (
          <div key={chip} class={style.skeletonChip} />
        ))}
      </div>
    );
  }
  const title = getBoxTitle(box);
  return (
    <div class={cx('card', style.skeletonCard)} style={{ minHeight: `${getBoxHeight(box)}px` }}>
      {title ? <div class={style.skeletonTitle}>{title}</div> : <div class={style.skeletonTitleBar} />}
      <div class={style.skeletonBlock} />
    </div>
  );
};

// No configuration cached yet (the prefetch hasn't landed): a plausible
// generic page, so the gesture still reveals something dashboard-shaped
const GENERIC_BOXES = [{ type: 'chart' }, { type: 'weather' }, { type: 'scene' }];

const DashboardSkeleton = ({ dashboard }) => {
  if (!dashboard || !Array.isArray(dashboard.boxes)) {
    return (
      <div>
        <div class={cx('d-flex flex-row flex-wrap justify-content-center align-items-stretch', style.sectionRow)}>
          <div
            class={cx('d-flex flex-column', style.dashboardColumn, style.removePadding)}
            style="--column-width: 100.0000%"
          >
            {GENERIC_BOXES.map((box, index) => (
              <SkeletonBox key={`generic-${index}-${box.type}`} box={box} />
            ))}
          </div>
        </div>
      </div>
    );
  }
  // same section/column arithmetic as BoxColumns, so the skeleton's grid is
  // the real grid: empty editor columns dropped, weights shared among the
  // filled columns only
  return (
    <div>
      {dashboard.boxes.map((section, sectionIndex) => {
        const widths = getSectionWidths(section);
        const filledColumns = section.columns
          .map((column, columnIndex) => ({ column, columnIndex }))
          .filter(({ column }) => column.length > 0);
        const totalWeight = filledColumns.reduce((sum, { columnIndex }) => sum + widths[columnIndex], 0);
        return (
          <div
            key={`section-${sectionIndex}`}
            class={cx('d-flex flex-row flex-wrap justify-content-center align-items-stretch', style.sectionRow)}
          >
            {filledColumns.map(({ column, columnIndex }) => (
              <div
                key={`column-${columnIndex}`}
                class={cx('d-flex flex-column', style.dashboardColumn, style.removePadding)}
                style={`--column-width: ${((widths[columnIndex] / totalWeight) * 100).toFixed(4)}%`}
              >
                {/* the type is part of the key: a prefetch landing
                    mid-gesture may reshape this tree (generic → real
                    config), and a reused instance must not keep the old
                    type's silhouette */}
                {column.map((box, y) => (
                  <SkeletonBox key={`box-${y}-${box.type}`} box={box} />
                ))}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default DashboardSkeleton;
