import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import SceneCards from './SceneCards';
import EmptyState from './EmptyState';
import PageOptions from '../../components/form/PageOptions';
import style from './style.css';

const ScenePage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="page-header">
            <h1 class="page-title">
              <Text id="scene.title" />
            </h1>
            <PageOptions
              changeOrderDir={props.changeOrderDir}
              placeholder={<Text id="scene.searchPlaceholder" />}
              debouncedSearch={props.debouncedSearch}
            >
              <Link href="/dashboard/scene/new" class="btn btn-outline-primary ml-2">
                <Text id="scene.newButton" /> <i class="fe fe-plus" />
              </Link>
            </PageOptions>
          </div>
          <div
            class={cx('dimmer', {
              active: props.loading
            })}
          >
            <div class="loader" />
            <div class={cx('dimmer-content', style.sceneListContainer)}>
              <div class="row">
                <div class="col-lg-12">
                  {props.scenes && <SceneCards {...props} />}
                  {props.scenes && props.scenes.length === 0 && <EmptyState />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ScenePage;
