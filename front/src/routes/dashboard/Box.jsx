import WeatherBox from '../../components/boxs/weather/WeatherBox';
import RoomTemperatureBox from '../../components/boxs/room-temperature/RoomTemperature';
import CameraBox from '../../components/boxs/camera/Camera';
import AtHomeBox from '../../components/boxs/user-presence/UserPresence';
import DevicesInRoomsBox from '../../components/boxs/device-in-room/DevicesInRoomsBox';
import ChartOneFeaturesBox from '../../components/boxs/chart-featue/ChartOneFeaturesBox';
import ChartMultiFeaturesBox from '../../components/boxs/chart-featue/ChartMultiFeaturesBox';

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
    case 'devices-in-room':
      return <DevicesInRoomsBox {...props} />;
    case 'chart-one-feature':
      return <ChartOneFeaturesBox {...props} />;
    case 'chart-multi-feature':
      return <ChartMultiFeaturesBox {...props} />;
  }
};

export default Box;
