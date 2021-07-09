import { Text } from 'preact-i18n';
import cx from 'classnames';
import EditBox from './EditBox';
import EditAddBoxButton from './EditAddBoxButton';
import style from './style.css';

const EditBoxColumns = ({ children, ...props }) => (
  <div>
    <div class="form-group">
      <label class="form-label">
        <Text id="dashboard.nameLabel" />
      </label>
      <input type="text" class="form-control" value="" />
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
