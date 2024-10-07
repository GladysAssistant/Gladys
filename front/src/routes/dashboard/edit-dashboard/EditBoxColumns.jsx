import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';

import EditBox from './EditBox';
import EmptyColumnDropZone from './EmptyColumnDropZone';
import BottomDropZone from './BottomDropZone';
import AutoScrollMobile from '../../../components/drag-and-drop/AutoScrollMobile';
import style from './style.css';
import stylePrimary from '../style.css';
import { DASHBOARD_VISIBILITY_LIST } from '../../../../../server/utils/constants';

const DASHBOARD_EDIT_BOX_TYPE = 'DASHBOARD_EDIT_BOX';
const maxBoxes = 3;
const getBoxesLength = props => {
  return props.homeDashboard.boxes.length;
};

const EditBoxColumns = ({ children, ...props }) => (
  <div class="pb-6">
    <h3>
      <Text id="dashboard.editDashboardTitle" />
    </h3>
    {props.dashboardAlreadyExistError && (
      <div class="alert alert-danger">
        <Text id="newDashboard.dashboardAlreadyExist" />
      </div>
    )}{' '}
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
    <div class="row align-items-end">
      <div class="col-md-4">
        <div class="form-group">
          <label class="form-label">
            <Text id="dashboard.editDashboardNameLabel" />
          </label>
          <Localizer>
            <input
              type="text"
              class="form-control"
              placeholder={<Text id="dashboard.editDashboardNameLabel" />}
              value={props.homeDashboard.name}
              onInput={props.updateCurrentDashboardName}
            />
          </Localizer>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-md-8">
        <div class="form-group">
          <label class="form-label">
            <Text id="dashboard.editDashboardVisibility" />
          </label>
          <small>
            <Text id="dashboard.editDashboardVisibilityDescription" />
          </small>
          {props.user.id !== props.homeDashboard.user_id && (
            <div>
              <small>
                <Text id="dashboard.editDashboardVisibilityNotEditableNotCreator" />
              </small>
            </div>
          )}
          <Localizer>
            <select
              value={props.homeDashboard.visibility}
              onChange={props.updateCurrentDashboardVisibility}
              disabled={props.user.id !== props.homeDashboard.user_id}
              class="form-control"
            >
              {DASHBOARD_VISIBILITY_LIST.map(dashboardVisibility => (
                <option value={dashboardVisibility}>
                  <Text id={`dashboard.visibilities.${dashboardVisibility}`} />
                </option>
              ))}
            </select>
          </Localizer>
        </div>
      </div>
    </div>
    <div class="row mb-4">
      <div class="col-md-12">
        <Text id="dashboard.editDashboardExplanation" />
      </div>
    </div>
    <div class="row mb-4">
      <div class="col-md-4 d-lg-none d-xl-none">
        <button
          class={cx('btn', {
            'btn-secondary': !props.isMobileReordering,
            'btn-warning': props.isMobileReordering
          })}
          onClick={props.toggleMobileReorder}
        >
          <i class="fe fe-list mr-2" />
          {!props.isMobileReordering && <Text id="dashboard.reorderDashboardButton" />}
          {props.isMobileReordering && <Text id="dashboard.stopReorderingDashboardButton" />}
        </button>
      </div>
    </div>
    <DndProvider backend={props.isTouchDevice ? TouchBackend : HTML5Backend}>
      {props.isMobileReordering && <AutoScrollMobile position="top" box_type={DASHBOARD_EDIT_BOX_TYPE} />}
      <div class={cx('d-flex align-items-start', style.columnsCard)}>
        {props.homeDashboard &&
          props.homeDashboard.boxes &&
          props.homeDashboard.boxes.map((column, x) => (
            <div
              class={cx('d-flex flex-column', style.column, stylePrimary.removePadding, {
                [stylePrimary.removePaddingFirstCol]: x === 0,
                [stylePrimary.removePaddingLastCol]: x === maxBoxes - 1
              })}
            >
              <div class={cx('d-flex', 'justify-content-center', style.columnBoxHeader)}>
                <h3 class="d-flex justify-content-center text-center">
                  <Text id="dashboard.boxes.column" fields={{ index: x + 1 }} />
                  {getBoxesLength(props) > 1 && (
                    <button
                      class={cx('btn p-0 ml-2', style.btnLinkDelete)}
                      onClick={() => props.deleteCurrentColumn(x)}
                    >
                      <i class="fe fe-trash" />
                    </button>
                  )}
                </h3>
              </div>
              {props.boxNotEmptyError && props.columnBoxNotEmptyError === x && (
                <div class="alert alert-danger d-flex justify-content-center mb-4">
                  <Text id="dashboard.editDashboardBoxNotEmpty" />
                </div>
              )}
              <div>
                {column.length > 0 && (
                  <div>
                    {column.map((box, y) => (
                      <EditBox {...props} box={box} x={x} y={y} isMobileReordering={props.isMobileReordering} />
                    ))}
                    <BottomDropZone
                      moveCard={props.moveCard}
                      x={x}
                      y={column.length}
                      isMobileReordering={props.isMobileReordering}
                    />
                  </div>
                )}

                {column.length === 0 && <EmptyColumnDropZone moveCard={props.moveCard} x={x} />}

                {props.isMobileReordering && <AutoScrollMobile position="bottom" box_type={DASHBOARD_EDIT_BOX_TYPE} />}
                <div class="d-flex justify-content-center mb-4">
                  <button class="btn btn-primary" onClick={() => props.addBox(x)}>
                    <Text id="dashboard.addBoxButton" /> <i class="fe fe-plus" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        {getBoxesLength(props) < maxBoxes && (
          <div class={cx('d-flex flex-column', style.columnAddButton)}>
            <div class={cx(style.columnBoxHeader)} />
            <Localizer>
              <button
                class={cx('btn btn-outline-primary', style.btnAddColumn)}
                onClick={() => props.addColumn(getBoxesLength(props))}
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
    </DndProvider>
  </div>
);

export default EditBoxColumns;
