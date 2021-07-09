import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import EditBox from './EditBox';
import EditAddBoxButton from './EditAddBoxButton';
import style from './style.css';

const EditBoxColumns = ({ children, ...props }) => (
  <div>
    <h2>
      <Text id="dashboard.editDashboardTitle" />
    </h2>
    <div class="row">
      <div class="col-md-12 mb-4">
        <div class="form-group">
          <label class="form-label">
            <Text id="dashboard.editDashboardNameLabel" />
          </label>
          <Localizer>
            <input
              type="text"
              class={cx('form-control', {
                'is-invalid': props.dashboardNameError
              })}
              placeholder={<Text id="dashboard.editDashboardNameLabel" />}
              value={props.homeDashboard.name}
              onInput={props.updateCurrentDashboardName}
            />
          </Localizer>
          <div class="invalid-feedback">
            <Text id="dashboard.invalidName" />
          </div>
        </div>
      </div>
    </div>
    <div class="d-flex flex-row flex-wrap justify-content-center pb-9">
      {props.homeDashboard &&
        props.homeDashboard.boxes.map((column, x) => (
          <div
            class={cx('d-flex flex-column col-lg-4', {
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
