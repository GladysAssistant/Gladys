import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import CardFilter from '../../components/layout/CardFilter';
import SceneCards from './SceneCards';
import EmptyState from './EmptyState';
import style from './style.css';
import SceneTagFilter from './SceneTagFilter';

const ScenePage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="page-header">
            <h1 class="page-title">
              <Text id="scene.title" />
            </h1>
            <div class="page-options d-flex">
              <SceneTagFilter tags={props.tags} searchTags={props.searchTags} sceneTagSearch={props.sceneTagSearch} />
              <Localizer>
                <CardFilter
                  changeOrderDir={props.changeOrderDir}
                  orderValue={props.getScenesOrderDir}
                  search={props.debouncedSearch}
                  searchValue={props.sceneSearch}
                  searchPlaceHolder={<Text id="scene.searchPlaceholder" />}
                />
              </Localizer>
              <Link href="/dashboard/scene/new" class={cx('btn', 'btn-outline-primary', 'ml-2', style.newButton)}>
                <span class="d-none d-lg-inline-block mr-2">
                  <Text id="scene.newButton" />
                </span>
                <i class="fe fe-plus" />
              </Link>
            </div>
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
