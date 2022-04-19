import { Component } from 'preact';
import { connect } from 'unistore/preact';
import BaseEditBox from '../baseEditBox';

const UserPresenceBox = ({ children, ...props }) => <BaseEditBox {...props} titleKey="dashboard.boxTitle.clock" />;

@connect('', {})
class EditClock extends Component {
  render(props, {}) {
    return <UserPresenceBox {...props} />;
  }
}

export default EditClock;
