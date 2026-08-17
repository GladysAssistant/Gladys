import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { DndProvider } from 'react-dnd';

import EditableBoxPreview from './EditableBoxPreview';
import EditorDragLayer from './EditorDragLayer';
import EditPanel from './EditPanel';
import EmptyColumnDropZone from './EmptyColumnDropZone';
import BottomDropZone from './BottomDropZone';
import { getDragAndDropBackend } from '../../../utils/dragAndDropBackend';
import { getSectionOffsets, MAX_COLUMNS_PER_SECTION } from '../../../utils/dashboardSections';
import style from './style.css';
import stylePrimary from '../style.css';

const getTotalColumns = props => {
  return props.homeDashboard.boxes.length;
};

const { backend: dragAndDropBackend, options: dragAndDropBackendOptions } = getDragAndDropBackend();

// Editor v2: the canvas IS the dashboard — real widgets with edit
// affordances, settings in a side panel / bottom sheet (EditPanel)
const EditBoxColumns = ({ children, ...props }) => (
  <div class="pb-6">
    <div class={style.editorTopBar}>
      <h3 class="mb-0">{props.homeDashboard.name}</h3>
      <button
        type="button"
        class="btn btn-sm btn-outline-primary"
        data-cy="dashboard-settings-button"
        onClick={props.openDashboardSettings}
      >
        <i class="fe fe-sliders mr-1" />
        <Text id="dashboard.editorDashboardSettingsButton" />
      </button>
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
    <p class={style.editorExplanation}>
      <Text id="dashboard.editDashboardExplanation" />
    </p>
    <DndProvider backend={dragAndDropBackend} options={dragAndDropBackendOptions}>
      {props.homeDashboard &&
        props.homeDashboard.boxes &&
        props.sectionSizes &&
        getSectionOffsets(props.sectionSizes).map((sectionOffset, sectionIndex) => {
          const sectionSize = props.sectionSizes[sectionIndex];
          const sectionColumns = props.homeDashboard.boxes.slice(sectionOffset, sectionOffset + sectionSize);
          return (
            <div class={style.section}>
              <div class={style.sectionHeader}>
                <Text id="dashboard.boxes.section" fields={{ index: sectionIndex + 1 }} />
                {/* one-step reorder arrows: dragging a whole section would be hell */}
                {props.sectionSizes.length > 1 && (
                  <span class={style.sectionActions}>
                    <Localizer>
                      <button
                        type="button"
                        class={style.previewButton}
                        disabled={sectionIndex === 0}
                        onClick={() => props.moveSection(sectionIndex, -1)}
                        data-cy={`move-section-up-${sectionIndex}`}
                        title={<Text id="dashboard.editorMoveSectionUp" />}
                      >
                        <i class="fe fe-arrow-up" />
                      </button>
                    </Localizer>
                    <Localizer>
                      <button
                        type="button"
                        class={style.previewButton}
                        disabled={sectionIndex === props.sectionSizes.length - 1}
                        onClick={() => props.moveSection(sectionIndex, 1)}
                        data-cy={`move-section-down-${sectionIndex}`}
                        title={<Text id="dashboard.editorMoveSectionDown" />}
                      >
                        <i class="fe fe-arrow-down" />
                      </button>
                    </Localizer>
                  </span>
                )}
              </div>
              <div class={cx('d-flex align-items-start', style.columnsCard)}>
                {sectionColumns.map((column, columnIndex) => {
                  const x = sectionOffset + columnIndex;
                  return (
                    <div
                      class={cx('d-flex flex-column', style.column, stylePrimary.removePadding, {
                        [stylePrimary.removePaddingFirstCol]: columnIndex === 0,
                        [stylePrimary.removePaddingLastCol]: columnIndex === sectionSize - 1
                      })}
                    >
                      <div class={style.columnBoxHeader}>
                        <span class={style.columnLabel}>
                          <Text id="dashboard.boxes.column" fields={{ index: columnIndex + 1 }} />
                          {getTotalColumns(props) > 1 && (
                            <button
                              class={cx('btn p-0 ml-2', style.btnLinkDelete)}
                              onClick={() => props.deleteCurrentColumn(x)}
                            >
                              <i class="fe fe-trash" />
                            </button>
                          )}
                        </span>
                      </div>
                      {props.boxNotEmptyError && props.columnBoxNotEmptyError === x && (
                        <div class="alert alert-danger d-flex justify-content-center mb-4">
                          <Text id="dashboard.editDashboardBoxNotEmpty" />
                        </div>
                      )}
                      <div>
                        {column.length > 0 && (
                          <>
                            {column.map((box, y) => (
                              <div key={`box-container-${x}-${y}`}>
                                <EditableBoxPreview {...props} box={box} x={x} y={y} columnLength={column.length} />
                                <div class="d-flex justify-content-center mb-2">
                                  <button
                                    class={cx('btn btn-sm px-4 py-0', style.btnAddNewBoxAtPosition)}
                                    onClick={() => props.addBoxAtPositionAndEdit(x, y)}
                                  >
                                    <i class="fe fe-plus" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            <BottomDropZone
                              moveCard={props.moveCard}
                              x={x}
                              y={column.length}
                              isMobileReordering={false}
                            />
                          </>
                        )}

                        {column.length === 0 && <EmptyColumnDropZone moveCard={props.moveCard} x={x} />}

                        {column.length === 0 && (
                          <div class="d-flex justify-content-center mb-4">
                            <button class="btn btn-primary" onClick={() => props.addBoxAndEdit(x)}>
                              <Text id="dashboard.addBoxButton" /> <i class="fe fe-plus" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {sectionSize < MAX_COLUMNS_PER_SECTION && (
                  <div class={cx('d-flex flex-column', style.columnAddButton)}>
                    <div class={cx(style.columnBoxHeader)} />
                    <Localizer>
                      <button
                        class={cx('btn btn-outline-primary', style.btnAddColumn)}
                        onClick={() => props.addColumn(sectionIndex)}
                        data-title={<Text id="dashboard.editDashboardAddColumnButton" />}
                      >
                        <i class="fe fe-plus" />
                        <div class={cx('d-none', style.displayTextMobile)}>
                          <Text id="dashboard.editDashboardAddColumnButton" />
                        </div>
                      </button>
                    </Localizer>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      <div class="d-flex justify-content-center mt-4">
        <button class="btn btn-outline-primary" onClick={props.addSection}>
          <Text id="dashboard.editDashboardAddSectionButton" /> <i class="fe fe-plus" />
        </button>
      </div>
      <EditPanel {...props} />
      <EditorDragLayer />
    </DndProvider>
  </div>
);

export default EditBoxColumns;
