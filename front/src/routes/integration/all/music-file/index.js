import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import MusicFilePage from './MusicFile';
import { RequestStatus } from '../../../../utils/consts';

class MusicFileInteration extends Component {
  componentWillMount() {
    this.props.getConfig();
  }

  render(props, {}) {
    const loading =
      props.musicFileSaveStatus === RequestStatus.Getting || props.musicFileGetStatus === RequestStatus.Getting;
    return <MusicFilePage {...props} loading={loading} />;
  }
}

export default connect(
  'user,session,musicFileDefaultFolder, musicFileReadSubFolder, musicFileEnableProvider, musicFileSaveStatus, musicFileGetStatus',
  actions
)(MusicFileInteration);
