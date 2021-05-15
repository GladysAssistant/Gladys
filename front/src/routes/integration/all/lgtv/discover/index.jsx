import { connect } from 'unistore/preact';
import actions from '../actions';
import DiscoverTab from './DiscoverTab';
import LGTVPage from '../LGTVPage';
import { route } from 'preact-router';
import { useCallback, useEffect } from 'preact/hooks';

const LGTVDiscoverPage = connect(
  'user,houses,scanLGTVDevicesStatus,scannedDevices',
  actions
)(props => {
  useEffect(() => {
    props.getLGTVDevices();
    props.getHouses();
    props.getIntegrationByName('lgtv');
  }, []);

  const onAddScannedDevice = useCallback(device => {
    (async () => {
      await props.createDevice(device);
      route('/dashboard/integration/device/lgtv');
    })();
  });

  return (
    <LGTVPage user={props.user}>
      <DiscoverTab onAddScannedDevice={onAddScannedDevice} onScan={props.scan} onAdd={() => {}} {...props} />
    </LGTVPage>
  );
});

export default LGTVDiscoverPage;
