import { Text } from 'preact-i18n';
import cx from 'classnames';

import { getSectionOffsets } from '../../../utils/dashboardSections';
import style from './style.css';

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
              <i class="fe fe-columns" aria-hidden="true" />
              <span class={style.moveTargetName}>
                <Text id="dashboard.boxes.column" fields={{ index: columnIndex + 1 }} />
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
