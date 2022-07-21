import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import EnedisLinkyPage from '../EnedisLinky';
import AccountTab from './AccountTab';
import { RequestStatus } from '../../../../../utils/consts';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';

@connect('enedisAccessToken,enedisRefreshToken,enedisSaveSettingsStatus,enedisGetSettingsStatus', actions)
class AccountPage extends Component {
  componentWillMount() {
    this.props.getEnedisSetting();
  }

  render(props, {}) {
    const loading =
      props.enedisSaveSettingsStatus === RequestStatus.Getting ||
      props.enedisGetSettingsStatus === RequestStatus.Getting;
    return (
      <EnedisLinkyPage>
        <AccountTab {...props} loading={loading} />
      </EnedisLinkyPage>
    );
  }
}

export default withIntlAsProp(AccountPage);
