import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import EditableBoxPreview from './EditableBoxPreview';
import EditPanel from './EditPanel';
import EmptyColumnDropZone from './EmptyColumnDropZone';
import EditorExplanation from './EditorExplanation';
import {
  DEFAULT_COLUMN_WIDTH,
  WIDE_COLUMN_WIDTH,
  canBoxStretchInColumn,
  getSectionOffsets,
  isTileStretchBox,
  isValueTileBox,
  MAX_COLUMNS_PER_SECTION
} from '../../../utils/dashboardSections';
import { DASHBOARD_SECTION_MOBILE_ORDER } from '../../../../../server/utils/constants';
import style from './style.css';
import stylePrimary from '../style.css';

const getTotalColumns = props => {
  return props.homeDashboard.boxes.length;
};

// Editor v2: the canvas IS the dashboard — real widgets with edit
// affordances, settings in a side panel / bottom sheet (EditPanel).
// Widget reordering runs on the pointer-events engine (utils/pointerDrag.js).
// Reorganize mode (props.reorganizing) collapses every widget to its toolbar
// row — the canvas becomes a short list to reorder and move widgets on a
// phone, instead of the full-size dashboard (CSS: .compactCanvas).
const EditBoxColumns = ({ children, ...props }) => (
  <div class={cx('pb-6', { [style.compactCanvas]: props.reorganizing })} data-cy="editor-canvas">
    <div class={style.editorTopBar}>
      <h3 class="mb-0">{props.homeDashboard.name}</h3>
      <div class={style.editorTopBarActions}>
        <button
          type="button"
          class={cx('btn btn-sm btn-outline-primary', { [style.topBarButtonActive]: props.reorganizing })}
          data-cy="reorganize-button"
          aria-pressed={props.reorganizing ? 'true' : 'false'}
          onClick={props.toggleReorganize}
        >
          <i class={cx('fe mr-1', props.reorganizing ? 'fe-maximize-2' : 'fe-list')} />
          {props.reorganizing ? <Text id="dashboard.editorReorganizeDone" /> : <Text id="dashboard.editorReorganize" />}
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline-primary"
          data-cy="dashboard-settings-button"
          onClick={props.openDashboardSettings}
        >
          <i class="fe fe-sliders mr-1" />
          {/* the full label next to "Reorganize" wraps the bar on a phone */}
          <span class="d-none d-sm-inline">
            <Text id="dashboard.editorDashboardSettingsButton" />
          </span>
          <span class="d-sm-none">
            <Text id="dashboard.editorDashboardSettingsShort" />
          </span>
        </button>
      </div>
    </div>
    {props.dashboardAlreadyExistError && (
      <div class="alert alert-danger">
        <Text id="newDashboard.dashboardAlreadyExist" />
      </div>
    )}
    {props.dashboardValidationError && (
      <div class="alert alert-danger">
        <Text id="newDashboard.validationError" />
      </div>
    )}
    {props.unknownError && (
      <div class="alert alert-danger">
        <Text id="newDashboard.unknownError" />
      </div>
    )}
    <EditorExplanation />
    <>
      {props.homeDashboard &&
        props.homeDashboard.boxes &&
        props.sectionSizes &&
        getSectionOffsets(props.sectionSizes).map((sectionOffset, sectionIndex) => {
          const sectionSize = props.sectionSizes[sectionIndex];
          const sectionColumns = props.homeDashboard.boxes.slice(sectionOffset, sectionOffset + sectionSize);
          // Same percentage shares as the viewer (BoxColumns), so the canvas
          // wraps its columns exactly where the real dashboard will. Only
          // difference: empty columns keep their share here — they must stay
          // editable — while the viewer skips them.
          const sectionWidths = sectionColumns.map(
            (column, i) => (props.columnWidths && props.columnWidths[sectionOffset + i]) || DEFAULT_COLUMN_WIDTH
          );
          const totalWeight = sectionWidths.reduce((sum, width) => sum + width, 0);
          return (
            <div class={style.section} data-widget-drop-section>
              <div class={style.sectionHeader}>
                <span>
                  <Text id="dashboard.boxes.section" fields={{ index: sectionIndex + 1 }} />
                </span>
                <span class={style.sectionActions}>
                  {/* the add-column control lives in the section header, NOT
                      as a flex sibling of the columns: a slot in the wrapping
                      row would make the canvas wrap a few pixels before the
                      viewer does */}
                  {/* on a phone the columns of a section stack: column by
                      column, or row by row (first widget of every column,
                      then the second…) — meaningless with a single column */}
                  {sectionSize > 1 && (
                    <Localizer>
                      <button
                        type="button"
                        class={style.sectionTextButton}
                        onClick={() => props.toggleSectionMobileOrder(sectionIndex)}
                        data-cy={`section-mobile-order-${sectionIndex}`}
                        title={<Text id="dashboard.editorMobileOrderHelp" />}
                      >
                        <i class="fe fe-smartphone" aria-hidden="true" />
                        {props.sectionMobileOrders &&
                        props.sectionMobileOrders[sectionIndex] === DASHBOARD_SECTION_MOBILE_ORDER.ROWS ? (
                          <Text id="dashboard.editorMobileOrderRows" />
                        ) : (
                          <Text id="dashboard.editorMobileOrderColumns" />
                        )}
                      </button>
                    </Localizer>
                  )}
                  {/* the add-column control lives in the section header, NOT
                      as a flex sibling of the columns: a slot in the wrapping
                      row would make the canvas wrap a few pixels before the
                      viewer does. It carries a text label: the canvas has
                      several "+" (widget, column, dashboard) */}
                  {sectionSize < MAX_COLUMNS_PER_SECTION && (
                    <button
                      type="button"
                      class={style.sectionTextButton}
                      onClick={() => props.addColumn(sectionIndex)}
                      data-cy={`add-column-${sectionIndex}`}
                    >
                      <i class="fe fe-plus" aria-hidden="true" />
                      <Text id="dashboard.editorAddColumnShort" />
                    </button>
                  )}
                  {/* one-step reorder arrows: dragging a whole section would be hell */}
                  {props.sectionSizes.length > 1 && (
                    <Localizer>
                      <button
                        type="button"
                        class={style.previewButton}
                        disabled={sectionIndex === 0}
                        onClick={() => props.moveSection(sectionIndex, -1)}
                        data-cy={`move-section-up-${sectionIndex}`}
                        title={<Text id="dashboard.editorMoveSectionUp" />}
                        aria-label={<Text id="dashboard.editorMoveSectionUp" />}
                      >
                        <i class="fe fe-arrow-up" />
                      </button>
                    </Localizer>
                  )}
                  {props.sectionSizes.length > 1 && (
                    <Localizer>
                      <button
                        type="button"
                        class={style.previewButton}
                        disabled={sectionIndex === props.sectionSizes.length - 1}
                        onClick={() => props.moveSection(sectionIndex, 1)}
                        data-cy={`move-section-down-${sectionIndex}`}
                        title={<Text id="dashboard.editorMoveSectionDown" />}
                        aria-label={<Text id="dashboard.editorMoveSectionDown" />}
                      >
                        <i class="fe fe-arrow-down" />
                      </button>
                    </Localizer>
                  )}
                </span>
              </div>
              {/* the viewer's row grammar (BoxColumns): the canvas IS the
                  dashboard, so columns must wrap and size exactly like the
                  real one — same classes, same breakpoint */}
              <div
                class={cx(
                  'd-flex flex-row flex-wrap justify-content-center align-items-stretch',
                  stylePrimary.sectionRow
                )}
              >
                {sectionColumns.map((column, columnIndex) => {
                  const x = sectionOffset + columnIndex;
                  const columnWidth = sectionWidths[columnIndex];
                  const isWide = columnWidth === WIDE_COLUMN_WIDTH;
                  return (
                    <div
                      class={cx('d-flex flex-column', stylePrimary.dashboardColumn, stylePrimary.removePadding)}
                      style={`--column-width: ${((columnWidth / totalWeight) * 100).toFixed(4)}%`}
                    >
                      <div class={style.columnBoxHeader}>
                        <span class={style.columnLabel}>
                          <Text id="dashboard.boxes.column" fields={{ index: columnIndex + 1 }} />
                          {/* a width only means something next to other columns */}
                          {sectionSize > 1 && (
                            <Localizer>
                              <button
                                type="button"
                                class={cx('btn p-0 ml-2', style.btnLinkDelete, style.columnWidthToggle, {
                                  [style.btnColumnWidthActive]: isWide
                                })}
                                onClick={() => props.toggleColumnWidth(x)}
                                data-cy={`toggle-column-width-${x}`}
                                aria-pressed={isWide}
                                aria-label={
                                  <Text
                                    id={
                                      isWide ? 'dashboard.editorColumnWidthNormal' : 'dashboard.editorColumnWidthWide'
                                    }
                                  />
                                }
                                title={
                                  <Text
                                    id={
                                      isWide ? 'dashboard.editorColumnWidthNormal' : 'dashboard.editorColumnWidthWide'
                                    }
                                  />
                                }
                              >
                                <i class={cx('fe', isWide ? 'fe-minimize-2' : 'fe-maximize-2')} aria-hidden="true" />
                              </button>
                            </Localizer>
                          )}
                          {getTotalColumns(props) > 1 && (
                            <Localizer>
                              <button
                                type="button"
                                class={cx('btn p-0 ml-2', style.btnLinkDelete)}
                                onClick={() => props.deleteCurrentColumn(x)}
                                aria-label={
                                  <Text id="dashboard.editorDeleteColumn" fields={{ index: columnIndex + 1 }} />
                                }
                                title={<Text id="dashboard.editorDeleteColumn" fields={{ index: columnIndex + 1 }} />}
                              >
                                <i class="fe fe-trash" aria-hidden="true" />
                              </button>
                            </Localizer>
                          )}
                        </span>
                      </div>
                      {props.boxNotEmptyError && props.columnBoxNotEmptyError === x && (
                        <div class="alert alert-danger d-flex justify-content-center mb-4">
                          <Text id="dashboard.editDashboardBoxNotEmpty" />
                        </div>
                      )}
                      <div
                        class={style.columnDropArea}
                        data-widget-drop
                        data-drop-x={x}
                        data-drop-active-class={style.columnDropActive}
                      >
                        {column.length > 0 &&
                          column.map((box, y) => {
                            // preview the viewer's vertical stretch (see
                            // .stretchPreview): a stretchable widget absorbs
                            // the free height of its column on the canvas too
                            const stretch = canBoxStretchInColumn(box, column, y === column.length - 1);
                            return (
                              <div
                                key={`box-container-${x}-${y}`}
                                class={cx({
                                  [style.stretchPreview]: stretch,
                                  [style.stretchTilePreview]: stretch && isTileStretchBox(box),
                                  [style.adaptiveTilePreview]: stretch && isValueTileBox(box),
                                  // global markers so widgets adapt their content
                                  // to their stretched card from their own
                                  // stylesheet, like the viewer's BoxColumns
                                  'dashboard-stretched-media': stretch && !isTileStretchBox(box),
                                  'dashboard-stretched-tile': stretch && isTileStretchBox(box)
                                })}
                              >
                                <EditableBoxPreview {...props} box={box} x={x} y={y} columnLength={column.length} />
                                <div class={cx('d-flex justify-content-center mb-2', style.addBetweenSlot)}>
                                  <Localizer>
                                    <button
                                      type="button"
                                      class={cx('btn btn-sm px-4 py-0', style.btnAddNewBoxAtPosition)}
                                      onClick={() => props.addBoxAtPositionAndEdit(x, y)}
                                      aria-label={<Text id="dashboard.editorAddWidgetHere" />}
                                      title={<Text id="dashboard.editorAddWidgetHere" />}
                                    >
                                      <i class="fe fe-plus" aria-hidden="true" />
                                    </button>
                                  </Localizer>
                                </div>
                              </div>
                            );
                          })}

                        {column.length === 0 && <EmptyColumnDropZone />}

                        {column.length === 0 && (
                          <div class="d-flex justify-content-center mb-4">
                            <button
                              class={cx('btn btn-primary', style.addWidgetButton)}
                              onClick={() => props.addBoxAndEdit(x)}
                            >
                              <Text id="dashboard.addBoxButton" /> <i class="fe fe-plus" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      <div class="d-flex justify-content-center mt-4">
        <button class={cx('btn btn-outline-primary', style.addSectionButton)} onClick={props.addSection}>
          <Text id="dashboard.editDashboardAddSectionButton" /> <i class="fe fe-plus" />
        </button>
      </div>
      <EditPanel {...props} />
    </>
  </div>
);

export default EditBoxColumns;
