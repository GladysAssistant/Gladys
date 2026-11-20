import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import MobileSceneRow from './MobileSceneRow';
import NewSceneSheet from './NewSceneSheet';
import EmptyState from './EmptyState';
import style from './mobile.css';
import dashboardStyle from '../dashboard/style.css';

/**
 * @description The scene list on a phone (docs/specs/scene-editor-mobile.md, D): a full-width
 * search, the tags as chips, one row per scene and a floating "+" creating a scene from its name.
 * The search and the tags live in the URL, as on the desktop list.
 */
class MobileScenePage extends Component {
  state = {
    newSceneOpen: false,
    // a new key on each opening: the creation sheet starts empty every time
    newSceneKey: 0
  };

  openNewScene = () => this.setState(prevState => ({ newSceneOpen: true, newSceneKey: prevState.newSceneKey + 1 }));
  closeNewScene = () => this.setState({ newSceneOpen: false });

  selectAllTags = () => this.props.searchTags([]);

  toggleTag = tagName => () => {
    const selected = this.props.sceneTagSearch || [];
    this.props.searchTags(
      selected.includes(tagName) ? selected.filter(tag => tag !== tagName) : [...selected, tagName]
    );
  };

  render(props, { newSceneOpen, newSceneKey }) {
    const selectedTags = props.sceneTagSearch || [];
    const language = get(props, 'user.language') || 'en';
    const hasActiveFilters = Boolean(props.sceneSearch || selectedTags.length > 0);
    return (
      <div class="page">
        <div class={cx('page-main', 'glass-theme', dashboardStyle.dashboardBackground, dashboardStyle.glassScene)}>
          <div class="container py-3">
            <div class={style.listHeader}>
              <h1 class={style.listTitle}>
                <Text id="scene.title" />
              </h1>
              <label class={style.search}>
                <i class="fe fe-search" aria-hidden="true" />
                <Localizer>
                  <input
                    type="search"
                    class={style.searchInput}
                    value={props.sceneSearch || ''}
                    onInput={props.search}
                    placeholder={<Text id="scene.searchPlaceholder" />}
                    aria-label={<Text id="scene.searchPlaceholder" />}
                    data-cy="scene-search"
                  />
                </Localizer>
              </label>
              {props.tags && props.tags.length > 0 && (
                <div class={style.chips}>
                  <button
                    type="button"
                    class={cx(style.chip, { [style.chipSelected]: selectedTags.length === 0 })}
                    aria-pressed={selectedTags.length === 0 ? 'true' : 'false'}
                    onClick={this.selectAllTags}
                  >
                    <Text id="scene.mobile.allTags" />
                  </button>
                  {props.tags.map(tag => (
                    <button
                      key={tag.name}
                      type="button"
                      class={cx(style.chip, { [style.chipSelected]: selectedTags.includes(tag.name) })}
                      aria-pressed={selectedTags.includes(tag.name) ? 'true' : 'false'}
                      onClick={this.toggleTag(tag.name)}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div class={cx('dimmer', { active: props.loading })}>
              <div class="loader" />
              <div class={cx('dimmer-content', style.sceneList)}>
                {props.scenes &&
                  props.scenes.map((scene, index) => (
                    <MobileSceneRow
                      key={scene.selector}
                      scene={scene}
                      index={index}
                      runningScenes={props.runningScenes}
                      now={props.now}
                      httpClient={props.httpClient}
                      switchActiveScene={props.switchActiveScene}
                      sceneSearch={props.sceneSearch}
                      orderDir={props.orderDir}
                      sceneTagSearch={selectedTags}
                      language={language}
                    />
                  ))}
                {props.scenes && props.scenes.length === 0 && <EmptyState hasActiveFilters={hasActiveFilters} />}
                {props.scenes && props.scenes.length > 0 && (
                  <p class={style.hint}>
                    <Text id="scene.mobile.swipeHint" />
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <Localizer>
          <button
            type="button"
            class={style.fab}
            onClick={this.openNewScene}
            aria-label={<Text id="scene.newButton" />}
            data-cy="scene-new-button"
          >
            <i class="fe fe-plus" />
          </button>
        </Localizer>

        <NewSceneSheet
          key={newSceneKey}
          open={newSceneOpen}
          onClose={this.closeNewScene}
          httpClient={props.httpClient}
        />
      </div>
    );
  }
}

export default MobileScenePage;
