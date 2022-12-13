import WeatherBox from '../../components/boxs/weather/WeatherBox';
import RoomTemperatureBox from '../../components/boxs/room-temperature/RoomTemperature';
import RoomHumidityBox from '../../components/boxs/room-humidity/RoomHumidity';
import CameraBox from '../../components/boxs/camera/Camera';
import AtHomeBox from '../../components/boxs/user-presence/UserPresence';
import DevicesInRoomsBox from '../../components/boxs/device-in-room/DevicesInRoomsBox';
import ChartBox from '../../components/boxs/chart/Chart';
import EcowattBox from '../../components/boxs/ecowatt/Ecowatt';

const Box = ({ children, ...props }) => {
  switch (props.box.type) {
    case 'weather':
      return <WeatherBox {...props} />;
    case 'user-presence':
      return <AtHomeBox {...props} />;
    case 'camera':
      return <CameraBox {...props} />;
    case 'temperature-in-room':
      return <RoomTemperatureBox {...props} />;
    case 'humidity-in-room':
      return <RoomHumidityBox {...props} />;
    case 'devices-in-room':
      return <DevicesInRoomsBox {...props} />;
    case 'chart':
      return <ChartBox {...props} />;
    case 'ecowatt':
      return <EcowattBox {...props} />;
  }
};

export default Box;
