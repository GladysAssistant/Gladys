import BluetoothPage from '../BluetoothPage';
import IntegrationDeviceList from '../../../../../components/integration/IntegrationDeviceList';

const BluetoothDevicePage = () => {
  return (
    <BluetoothPage>
      <IntegrationDeviceList integrationName="bluetooth" />
    </BluetoothPage>
  );
};

export default BluetoothDevicePage;
