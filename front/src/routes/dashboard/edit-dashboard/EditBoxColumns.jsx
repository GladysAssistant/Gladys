import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';

import EditBox from './EditBox';
import EmptyColumnDropZone from './EmptyColumnDropZone';
import BottomDropZone from './BottomDropZone';
import AutoScrollMobile from '../../../components/drag-and-drop/AutoScrollMobile';
import style from '../style.css';

const DASHBOARD_EDIT_BOX_TYPE = 'DASHBOARD_EDIT_BOX';

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
    <div class="row mb-4">
      <div class="col-md-12">
        <Text id="dashboard.editDashboardExplanation" />
      </div>
    </div>
    <div class="row mb-6">
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
      <div class="d-flex flex-row flex-wrap justify-content-center">
        {props.homeDashboard &&
          props.homeDashboard.boxes &&
          props.homeDashboard.boxes.map((column, x) => (
            <div
              class={cx('d-flex flex-column col-lg-4', style.removePadding, {
                [style.removePaddingFirstCol]: x === 0,
                [style.removePaddingLastCol]: x === 2
              })}
            >
              <h3 class="text-center">
                <Text id="dashboard.boxes.column" fields={{ index: x + 1 }} />
              </h3>

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
            </div>
          ))}
      </div>
      {props.isMobileReordering && <AutoScrollMobile position="bottom" box_type={DASHBOARD_EDIT_BOX_TYPE} />}
      <div class="d-flex justify-content-center">
        <button class="btn btn-primary" onClick={props.addBox}>
          <Text id="dashboard.addBoxButton" /> <i class="fe fe-plus" />
        </button>
      </div>
    </DndProvider>
  </div>
);

export default EditBoxColumns;
