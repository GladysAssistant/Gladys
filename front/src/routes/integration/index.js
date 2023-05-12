import { Component } from 'preact';
import { connect } from 'unistore/preact';

import IntegrationPage from './IntegrationPage';
import actions from '../../actions/integration';
import withIntlAsProp from '../../utils/withIntlAsProp';

class Integration extends Component {
  componentWillMount() {
    this.props.getIntegrations(this.props.intl);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.user !== this.props.user) {
      this.props.getIntegrations(this.props.intl, this.props.category, null);
    }
  }

  render(props, {}) {
    return <IntegrationPage {...props} />;
  }
}

export default withIntlAsProp(
  connect('user,integrations,integrationCategories,currentUrl,totalSize,searchKeyword,orderDir', actions)(Integration)
);
