import { Text } from 'preact-i18n';
import { Component } from 'preact';
import { Link } from 'preact-router/match';
import style from './style.css';

class SceneCard extends Component {
  startScene = () => {
    this.props.startScene(this.props.scene.selector);
  };

  render(props, {}) {
    return (
      <div class="col-sm-6 col-lg-3">
        <div class="card h-100">
          <div class="card-body p-3 text-center">
            <div class={style.scene_icon}>
              <i class={`fe fe-${props.scene.icon}`} />
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
              <button onClick={this.startScene} type="button" class="btn btn-outline-success btn-sm">
                <i class="fe fe-play" />
                <Text id="scene.startButton" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SceneCard;
