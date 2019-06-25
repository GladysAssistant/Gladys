import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../../../actions/createScene';
import NewScenePage from './NewScenePage';

@connect(
  'newScene,newSceneErrors,createSceneStatus',
  actions
)
class NewScene extends Component {
  componentWillMount() {
    this.props.initScene();
  }

  render(props, {}) {
    return <NewScenePage {...props} />;
  }
}

export default NewScene;
