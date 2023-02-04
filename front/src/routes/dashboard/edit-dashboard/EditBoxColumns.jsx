import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import EditBox from './EditBox';
import EditAddBoxButton from './EditAddBoxButton';
import style from '../style.css';

const EditBoxColumns = ({ children, ...props }) => (
  <div>
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
    <div class="row mb-4 align-items-end">
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
    <div class="d-flex flex-row flex-wrap justify-content-center pb-9">
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

            {column.map((box, y) => (
              <EditBox {...props} box={box} x={x} y={y} />
            ))}

            <EditAddBoxButton addBox={props.addBox} updateNewSelectedBox={props.updateNewSelectedBox} x={x} />
          </div>
        ))}
    </div>
  </div>
);

export default EditBoxColumns;
