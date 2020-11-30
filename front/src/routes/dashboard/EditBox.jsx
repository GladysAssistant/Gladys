import { Text } from 'preact-i18n';
import EditWeatherBox from '../../components/boxs/weather/EditWeatherBox';
import EditRoomTemperatureBox from '../../components/boxs/room-temperature/EditRoomTemperatureBox';
import EditCameraBox from '../../components/boxs/camera/EditCamera';
import EditAtHomeBox from '../../components/boxs/user-presence/EditUserPresenceBox';
import EditDevicesInRoom from '../../components/boxs/device-in-room/EditDeviceInRoom';
import EditChartOneFeatures from '../../components/boxs/chart-feature/EditChartOneFeatures';
import EditChartMultiFeatures from '../../components/boxs/chart-feature/EditChartMultiFeatures';

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
    case 'devices-in-room':
      return <EditDevicesInRoom {...props} />;
    case 'chart-one-feature':
      return <EditChartOneFeatures {...props} />;
    case 'chart-multi-feature':
      return <EditChartMultiFeatures {...props} />;
  }
};

const EditBoxWithDragAndDrop = ({ children, ...props }) => (
  <div>
    {props.dragEnable && (
      <div
        style={{
          height: '50px',
          padding: '10px',
          borderStyle: 'dashed',
          borderColor: 'grey',
          marginBottom: '1.5rem'
        }}
      >
        <p class="text-center">
          <Text id="dashboard.boxes.dragAndDrop" />
        </p>
      </div>
    )}
    <div>
      <Box {...props} />
    </div>
  </div>
);

export default EditBoxWithDragAndDrop;
