import { Text } from 'preact-i18n';
import EditBox from './EditBox';
import EditAddBoxButton from './EditAddBoxButton';

const EditBoxColumns = ({ children, ...props }) => (
  <div class="d-flex flex-row flex-wrap justify-content-center pb-9">
    {props.homeDashboard &&
      props.homeDashboard.boxes.map((column, x) => (
        <div class="d-flex flex-column col-lg-4">
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
);

export default EditBoxColumns;
