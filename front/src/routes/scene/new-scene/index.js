import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../../../actions/createScene';
import NewScenePage from './NewScenePage';

class NewScene extends Component {
  componentDidMount() {
    this.props.initScene();
  }

  render(props, {}) {
    return <NewScenePage {...props} />;
  }
}

export default connect('newScene,newSceneErrors,createSceneStatus', actions)(NewScene);
