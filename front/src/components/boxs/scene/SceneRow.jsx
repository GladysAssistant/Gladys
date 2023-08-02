import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import { Component } from 'preact';

class SceneRow extends Component {
  startScene = async () => {
    try {
      await this.setState({ loading: true });
      await this.props.httpClient.post(`/api/v1/scene/${this.props.sceneSelector}/start`);
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => this.setState({ loading: false }), 500);
  };

  render({ children, ...props }, { loading }) {
    return (
      <tr>
        <td>
          <i className={`fe fe-${props.icon}`} />
        </td>
        <td>{props.name}</td>
        <td className="text-right">
          <button onClick={this.startScene} type="button" className="btn btn-outline-success btn-sm" disabled={loading}>
            <i class="fe fe-play" />
            <Text id="scene.startButton" />
          </button>
        </td>
      </tr>
    );
  }
}
export default connect('httpClient', {})(SceneRow);
