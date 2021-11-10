import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import style from './style.css';

const TriggerCards = ({ children, ...props }) => (
  <div class="row row-cards">
    {props.scenes.map(scene => (
      <div class="col-sm-6 col-lg-3">
        <div class="card h-100">
          <div class="card-body p-3 text-center">
            <div class="text-right text-green">
              <a href="#" class="icon" data-toggle="card-remove">
                <i class="icon-trash" />
              </a>
            </div>
            <div class={style.scene_icon}>
              <i class={`icon-${scene.icon}`} />
            </div>
            <h4>{scene.name}</h4>
            <div class="text-muted">{scene.description}</div>
          </div>
          <div class="card-footer">
            <div class="btn-list text-center">
              <Link href={`${props.currentUrl}/${scene.id}`} class="btn btn-outline-primary btn-sm">
                <i class="icon-edit" />
                <Text id="scene.editButton" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default TriggerCards;
