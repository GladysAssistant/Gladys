import ZwavePage from '../ZwavePage';
import IntegrationDeviceList from '../../../../../components/integration/IntegrationDeviceList';

const ZwaveNodePage = () => {
  return (
    <ZwavePage>
      <IntegrationDeviceList integrationName="zwave" />
    </ZwavePage>
  );
};

export default ZwaveNodePage;
