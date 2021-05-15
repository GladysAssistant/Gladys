import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import DeviceTab from './DeviceTab';
import LGTVPage from '../LGTVPage';
import { route } from 'preact-router';
import { useCallback, useEffect } from 'preact/hooks';

const LGTVDevicesPage = connect(
  'user,houses,lgtvDevices,getLGTVDevicesStatus',
  actions
)(props => {
  useEffect(() => {
    props.getLGTVDevices();
    props.getHouses();
    props.getIntegrationByName('lgtv');
  }, []);

  const onScan = useCallback(() => {
    props.scan();
    route('/dashboard/integration/device/lgtv/discover');
  });

  return (
    <LGTVPage user={props.user}>
      <DeviceTab onScan={onScan} onAdd={() => {}} {...props} />
    </LGTVPage>
  );
});

export default LGTVDevicesPage;
