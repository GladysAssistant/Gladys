import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import KodiPage from '../KodiPage';
import FoundDevices from './FoundDevices';

@connect('user,session,kodiDevices,houses,kodiNewDevices', actions)
class KodiDevicePage extends Component {
  componentWillMount() {
    this.props.getKodiDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('kodi');
  }

  render(props, {}) {
    return (
      <KodiPage>
        <FoundDevices {...props} />
      </KodiPage>
    );
  }
}

export default KodiDevicePage;
