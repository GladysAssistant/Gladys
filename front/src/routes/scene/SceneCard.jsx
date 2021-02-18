import { Text } from 'preact-i18n';
import { Component } from 'preact';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import style from './style.css';

class SceneCard extends Component {
  executeScene = async () => {
    try {
      await this.setState({ saving: true });
      await this.props.httpClient.post(`/api/v1/scene/${this.props.scene.selector}/start`);
    } catch (e) {
      console.error(e);
    }

    // make sure the loader is displayed at least 200ms
    setTimeout(() => this.setState({ saving: false }), 200);
  };

  switchActive = async () => {
    await this.setActive(!this.props.scene.active);
  };

  setActive = async value => {
    this.setState({ saving: true });
    try {
      const updatedScene = await this.props.httpClient.patch(`/api/v1/scene/${this.props.scene.selector}`, {
        active: value
      });
      this.props.scene.active = updatedScene.active;
    } catch (e) {
      console.error(e);
    }
    this.setState({ saving: false });
  };

  render(props, { saving }) {
    return (
      <div class="col-sm-6 col-lg-3">
        <div class="card h-100">
          <div
            class={cx('dimmer', {
              active: saving
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body p-3 text-center">
                <div class={style.scene_icon}>
                  <i class={`fe fe-${props.scene.icon}`} />
                </div>
                <div style={{ position: 'absolute', top: '5%', right: '5%' }}>
                  <label className="custom-switch m-0">
                    <input
                      type="checkbox"
                      name="active"
                      value="1"
                      className="custom-switch-input"
                      checked={props.scene.active}
                      onClick={this.switchActive}
                    />
                    <span className="custom-switch-indicator" />
                  </label>
                </div>
                <h4>{props.scene.name}</h4>
                <div class="text-muted">{props.scene.description}</div>
              </div>
              <div class="card-footer">
                <div class="btn-list text-center">
                  <Link href={`${props.currentUrl}/${props.scene.selector}`} class="btn btn-outline-primary btn-sm">
                    <i class="fe fe-edit" />
                    <Text id="scene.editButton" />
                  </Link>
                  <button onClick={this.executeScene} type="button" className="btn btn-outline-success btn-sm">
                    <i className="fe fe-play" />
                    <Text id="scene.testButton" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SceneCard;
