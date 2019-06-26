import Box from './Box';

const BoxColumns = ({ children, ...props }) => (
  <div class="d-flex flex-row flex-wrap justify-content-center">
    {props.homeDashboard &&
      props.homeDashboard.boxes.map((column, x) => (
        <div class="d-flex flex-column col-lg-4">
          {column.map((box, y) => (
            <Box box={box} x={x} y={y} />
          ))}
        </div>
      ))}
  </div>
);

export default BoxColumns;
