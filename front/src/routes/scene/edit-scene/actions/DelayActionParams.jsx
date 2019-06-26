const updateTime = (updateActionProperty, columnIndex, rowIndex) => e => {
  const time = e.target.value;
  const timeSplitted = time.split(':');
  const minutes = parseInt(timeSplitted[0], 10);
  let seconds = parseInt(timeSplitted[1], 10);
  if (minutes > 0) {
    seconds += minutes * 60;
  }
  updateActionProperty(columnIndex, rowIndex, 'seconds', seconds);
};

const convertTime = action => {
  const secNum = parseInt(action.seconds, 10); // don't forget the second param
  let minutes = Math.floor(secNum / 60);
  let seconds = secNum - minutes * 60;

  if (minutes < 10) {
    minutes = '0' + minutes;
  }
  if (seconds < 10) {
    seconds = '0' + seconds;
  }
  return minutes + ':' + seconds;
};

const WaitActionParams = ({ children, ...props }) => (
  <input
    class="form-control"
    type="time"
    value={convertTime(props.action)}
    onChange={updateTime(props.updateActionProperty, props.columnIndex, props.index)}
  />
);

export default WaitActionParams;
