import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import CardFilter from '../../components/layout/CardFilter';
import SceneCards from './SceneCards';
import EmptyState from './EmptyState';
import style from './style.css';
import dashboardStyle from '../dashboard/style.css';
import SceneTagFilter from './SceneTagFilter';

const ScenePage = ({ children, ...props }) => (
  <div class="page">
    {/* The scene pages live on the same Horizon glass scene as the dashboard.
        The scene list has no per-page appearance, so it takes the default
        scene directly instead of going through getBackgroundSceneClass */}
    <div class={cx('page-main', 'glass-theme', dashboardStyle.dashboardBackground, dashboardStyle.glassScene)}>
      {/* padding, not margin: a top margin collapses through the glass
          page-main and shifts the scene down */}
      <div class="py-3 py-md-5">
        <div class="container">
          <div class={cx('page-header', style.pageHeaderResponsive)}>
            <h1 class="page-title">
              <Text id="scene.title" />
            </h1>
            <div class="page-options d-flex">
              <SceneTagFilter tags={props.tags} searchTags={props.searchTags} sceneTagSearch={props.sceneTagSearch} />
              <Localizer>
                <CardFilter
                  changeOrderDir={props.changeOrderDir}
                  orderValue={props.orderDir}
                  search={props.search}
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
              <div class="row mt-2">
                <div class="col-lg-12">
                  {props.scenes && <SceneCards {...props} />}
                  {props.scenes && props.scenes.length === 0 && (
                    <EmptyState
                      hasActiveFilters={Boolean(
                        props.sceneSearch || (props.sceneTagSearch && props.sceneTagSearch.length > 0)
                      )}
                    />
                  )}
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
