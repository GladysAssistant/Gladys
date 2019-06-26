import RoomCard from './RoomCard';

const DeviceList = ({ children, ...props }) => (
  <div class="card-columns">
    {props.rooms.map((room, index) => (
      <RoomCard room={room} roomIndex={index} updateValue={props.updateValue} collapseRoom={props.collapseRoom} />
    ))}
  </div>
);

export default DeviceList;
