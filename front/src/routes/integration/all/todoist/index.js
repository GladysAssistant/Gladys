import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { RequestStatus } from '../../../../utils/consts';
import actions from './actions';
import TodoistPage from './Todoist';

@connect('user,todoistApiKey,todoistSaveApiKeyStatus,todoistGetApiKeyStatus', actions)
class TodoistIntegration extends Component {
  componentWillMount() {
    this.props.getApiKey();
  }

  render(props, {}) {
    const loading =
      props.todoistSaveApiKeyStatus === RequestStatus.Getting ||
      props.todoistGetApiKeyStatus === RequestStatus.Getting;
    return <TodoistPage {...props} loading={loading} />;
  }
}

export default TodoistIntegration;
