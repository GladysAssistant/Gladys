import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../../actions/oauth/authorize';
import AuthorizePage from './AuthorizePage';
import { RequestStatus } from '../../utils/consts';

@connect(
  'oauthStatus,oauthClient,redirectUri,oauthState',
  actions
)
class Authorize extends Component {
  constructor(props) {
    super(props);

    this.state = {
      oauthStatus: RequestStatus.Getting
    };
  }
  componentWillMount() {
    this.props.loadClient(this.props.matches);
  }

  render(props) {
    return <AuthorizePage {...props} />;
  }
}

export default Authorize;
