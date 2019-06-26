import { connect } from 'unistore/preact';
import PageLayout from '../../components/layout/page';
import deviceActions from '../../actions/device';
import EmptyState from '../../components/boxs/device-in-room/EmptyState';
import DeviceList from '../../components/boxs/device-in-room/DeviceList';

const DevicePage = connect(
  'user,rooms',
  deviceActions
)(({ rooms, updateValue, collapseRoom }) => (
  <PageLayout>
    <div class="container">
      {rooms && <DeviceList rooms={rooms} updateValue={updateValue} collapseRoom={collapseRoom} />}
      {rooms && rooms.length === 0 && <EmptyState />}
    </div>
  </PageLayout>
));

export default DevicePage;
