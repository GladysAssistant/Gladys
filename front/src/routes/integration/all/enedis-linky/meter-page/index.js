// import { Component } from 'preact';
// import { connect } from 'unistore/preact';
// import actions from './actions';
// import EnedisLinkyPage from './EnedisLinky';

// @connect('enedisLinkys,housesWithRooms,getEnedisLinkyStatus', actions)
// class EnedisLinkyIntegration extends Component {
//   componentWillMount() {
//     this.props.getEnedisLinkyDevices();
//     this.props.getHouses();
//     this.props.getIntegrationByName('enedis-linky');
//   }

//   render(props, {}) {
//     return <EnedisLinkyPage {...props} />;
//   }
// }

// export default EnedisLinkyIntegration;

import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import EnedisLinkyPage from '../EnedisLinky';
import MeterTab from './MeterTab';
import { RequestStatus } from '../../../../../utils/consts';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';

@connect('enedisLinkys,housesWithRooms,getEnedisLinkyStatus', actions)
class MeterPage extends Component {
  componentWillMount() {
    this.props.getEnedisLinkyDevices();
    this.props.getHouses();
  }

  render(props, { }) {
    const loading = props.getEnedisLinkyStatus === RequestStatus.Getting;
    return (
      <EnedisLinkyPage>
        <MeterTab {...props} loading={loading} />
      </EnedisLinkyPage>
    );
  }
}

export default withIntlAsProp(MeterPage);
