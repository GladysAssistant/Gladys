import { Text } from 'preact-i18n';
import cx from 'classnames';

import { getSectionOffsets } from '../../../utils/dashboardSections';
import style from './style.css';

const MAX_LISTED_WIDGETS = 3;

// What a column holds, so the target is recognisable while the sheet covers
// the canvas: the first widgets by name (their type when unnamed), the
// same title the canvas toolbar shows
const ColumnContent = ({ column }) => {
  const listed = column.filter(box => box && box.type).slice(0, MAX_LISTED_WIDGETS);
  if (listed.length === 0) {
    return null;
  }
  return (
    <span class={style.moveTargetContent}>
      {listed.map((box, index) => (
        <span key={index}>
          {index > 0 && ', '}
          {box.name || <Text id={`dashboard.boxTitle.${box.type}`} />}
        </span>
      ))}
      {column.length > MAX_LISTED_WIDGETS && '…'}
    </span>
  );
};

// "Move to…" (edit panel): every column of every section, the widget lands
// at the end of the chosen one. The touch — and keyboard — alternative to
// dragging a widget across columns and sections, which a phone cannot do
// (the drag handle only exists from the desktop breakpoint).
const MoveBoxForm = ({ homeDashboard, sectionSizes, position, moveBoxTo }) => (
  <div data-cy="move-box-form">
    <p class={style.moveHint}>
      <Text id="dashboard.editorMoveWidgetHint" />
    </p>
    {getSectionOffsets(sectionSizes).map((sectionOffset, sectionIndex) => (
      <div class={style.moveSection} key={`move-section-${sectionIndex}`}>
        <div class={style.moveSectionTitle}>
          <Text id="dashboard.boxes.section" fields={{ index: sectionIndex + 1 }} />
        </div>
        {Array.from({ length: sectionSizes[sectionIndex] }, (_, columnIndex) => {
          const x = sectionOffset + columnIndex;
          const isCurrent = x === position.x;
          const count = homeDashboard.boxes[x].length;
          return (
            <button
              type="button"
              key={`move-column-${x}`}
              class={cx(style.moveTarget, { [style.moveTargetCurrent]: isCurrent })}
              onClick={() => moveBoxTo(position.x, position.y, x)}
              disabled={isCurrent}
              aria-current={isCurrent ? 'true' : undefined}
              data-cy={`move-target-${x}`}
            >
              <i class="fe fe-sidebar" aria-hidden="true" />
              <span class={style.moveTargetName}>
                <Text id="dashboard.boxes.column" fields={{ index: columnIndex + 1 }} />
                <ColumnContent column={homeDashboard.boxes[x]} />
              </span>
              <span class={style.moveTargetMeta}>
                {isCurrent ? (
                  <Text id="dashboard.editorMoveCurrentColumn" />
                ) : (
                  <Text id="dashboard.editorMoveWidgetCount" plural={count} fields={{ count }} />
                )}
              </span>
            </button>
          );
        })}
      </div>
    ))}
  </div>
);

export default MoveBoxForm;
