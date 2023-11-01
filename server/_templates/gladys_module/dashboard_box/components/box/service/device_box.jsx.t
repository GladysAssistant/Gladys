---
to: ../front/src/components/boxs/<%= module %>/<%= className %>Box.jsx
---
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import { RequestStatus } from '../../../utils/consts';
import get from 'get-value';

const <%= className %>Box = ({ children, loading, error, ...props }) => {
  const { boxTitle } = props;
  return (
    <div class="card">
        <div class="card-header">
        <h3 class="card-title">
            <i class="fe fe-zap" />
            <span class="m-1">
            {boxTitle}
            </span>
        </h3>
        </div>
        <div class="card-body">
        <div class={`dimmer ${loading ? 'active' : ''}`}>
            <div class="loader" />
            {error && (
            <p class="alert alert-danger">
                <i class="fe fe-bell" />
                <span class="pl-2">
                <Text id="dashboard.boxes.<%= module %>.error" />
                </span>
            </p>
            )}
            {!error && (
            <div class="dimmer-content" style={{ minHeight: '200px' }}>
                <div class="row">
                Row 1
                </div>
                <div class="row">
                Row 2
                </div>
                <div class="mt-3">
                    To be continued
                </div>
            </div>
            )}
        </div>
        </div>
    </div>
    );
};

class <%= className %> extends Component {
  
  refreshData = async () => {
    try {
      await this.setState({ error: false, loading: true });
      // todo : do something smart
      this.setState({ error: false, loading: false });
    } catch (e) {
      this.setState({ error: true, loading: false });
    }
  };

  componentDidMount() {
    await this.refreshData();
  };

  componentDidUpdate(previousProps) {
    // todo : do something when box config has changed (ie: box name, device configured,...)
  };

  componentWillUnmount() {
    // todo : do something when box will disapear (ie: remove listener,...)
  };

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      loading: true,
      error: false
    };
  };

  render({}, { loading, error }) {
    const boxTitle = get(this.props.box, 'title');
    return <<%= className %>Box loading={loading} error={error} boxTitle={boxTitle} />;
  }
}

export default connect('httpClient,user', {})(<%= className %>);