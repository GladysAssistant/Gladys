import { Text } from 'preact-i18n';
import EditWeatherBox from '../../components/boxs/weather/EditWeatherBox';
import EditRoomTemperatureBox from '../../components/boxs/room-temperature/EditRoomTemperatureBox';
import EditRoomHumidityBox from '../../components/boxs/room-humidity/EditRoomHumidityBox';
import EditCameraBox from '../../components/boxs/camera/EditCamera';
import EditAtHomeBox from '../../components/boxs/user-presence/EditUserPresenceBox';
import EditDevicesInRoom from '../../components/boxs/device-in-room/EditDeviceInRoom';

const Box = ({ children, ...props }) => {
  switch (props.box.type) {
    case 'weather':
      return <EditWeatherBox {...props} />;
    case 'user-presence':
      return <EditAtHomeBox {...props} />;
    case 'camera':
      return <EditCameraBox {...props} />;
    case 'temperature-in-room':
      return <EditRoomTemperatureBox {...props} />;
    case 'humidity-in-room':
      return <EditRoomHumidityBox {...props} />;
    case 'devices-in-room':
      return <EditDevicesInRoom {...props} />;
  }
};

const EditBoxWithDragAndDrop = ({ children, ...props }) => (
  <div>
    <Box {...props} />
  </div>
);

export default EditBoxWithDragAndDrop;
