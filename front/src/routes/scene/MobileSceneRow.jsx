import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { route } from 'preact-router';
import cx from 'classnames';

import RelativeTime from '../../components/device/RelativeTime';
import SwipeRow from './SwipeRow';
import RunningStopButton from './RunningStopButton';
import { computeRunningInfo } from './runningInfo';
import style from './mobile.css';

/**
 * @description A scene of the list on a phone (docs/specs/scene-editor-mobile.md, D.2 / D.3):
 * the row opens the editor, the play button starts the scene, a swipe to the left reveals
 * Disable / Enable and Duplicate.
 */
class MobileSceneRow extends Component {
  state = {
    starting: false
  };

  getSceneUrl = () => {
    const { scene, sceneSearch, orderDir, sceneTagSearch } = this.props;
    const urlParams = new URLSearchParams();
    if (sceneSearch) {
      urlParams.set('search', sceneSearch);
    }
    if (orderDir) {
      urlParams.set('order_dir', orderDir);
    }
    (sceneTagSearch || []).forEach(tag => urlParams.append('tags', tag));
    const search = urlParams.toString();
    return `/dashboard/scene/${scene.selector}${search ? `?${search}` : ''}`;
  };

  startScene = async () => {
    const { scene, runningScenes, now, httpClient } = this.props;
    if (computeRunningInfo(runningScenes, scene.selector, now)) {
      return;
    }
    this.setState({ starting: true });
    try {
      await httpClient.post(`/api/v1/scene/${scene.selector}/start`);
    } catch (e) {
      console.error(e);
    }
    // the loader stays at least 200ms, so the tap is acknowledged
    setTimeout(() => this.setState({ starting: false }), 200);
  };

  stopScene = async () => {
    try {
      await this.props.httpClient.post(`/api/v1/scene/${this.props.scene.selector}/stop`);
    } catch (e) {
      console.error(e);
    }
  };

  toggleActive = () => {
    this.props.switchActiveScene(this.props.index);
  };

  duplicate = () => {
    route(`/dashboard/scene/${this.props.scene.selector}/duplicate`);
  };

  render({ scene, runningScenes, now, language }, { starting }) {
    const runningInfo = computeRunningInfo(runningScenes, scene.selector, now);
    return (
      <SwipeRow
        dataCy={`scene-row-${scene.selector}`}
        actions={[
          {
            key: 'active',
            labelId: scene.active ? 'scene.mobile.disable' : 'scene.mobile.enable',
            icon: 'power',
            tone: 'neutral',
            onClick: this.toggleActive,
            dataCy: `scene-row-toggle-${scene.selector}`
          },
          {
            key: 'duplicate',
            labelId: 'editScene.duplicateButton',
            icon: 'copy',
            tone: 'accent',
            onClick: this.duplicate
          }
        ]}
      >
        <div class={style.sceneRow}>
          <a href={this.getSceneUrl()} class={style.sceneRowOpen}>
            <span class={cx(style.sceneTile, { [style.sceneTileDisabled]: !scene.active })} aria-hidden="true">
              <i class={`fe fe-${scene.icon}`} />
            </span>
            <span class={style.rowText}>
              <span class={style.rowTitle}>{scene.name}</span>
              <span class={style.rowSub}>
                {!scene.active && (
                  <>
                    <Text id="scene.mobile.disabled" />
                    {scene.description ? ' · ' : ''}
                  </>
                )}
                {scene.description}
              </span>
              <span class={style.rowMeta}>
                {scene.last_executed ? (
                  <>
                    <Text id="editScene.mobile.lastRun" />{' '}
                    <RelativeTime datetime={scene.last_executed} language={language} futureDisabled />
                  </>
                ) : (
                  <Text id="editScene.mobile.neverRun" />
                )}
              </span>
            </span>
          </a>
          {runningInfo ? (
            <RunningStopButton runningInfo={runningInfo} onStop={this.stopScene} small />
          ) : (
            <Localizer>
              <button
                type="button"
                class={style.playButton}
                onClick={this.startScene}
                disabled={starting}
                aria-label={<Text id="scene.mobile.runScene" fields={{ name: scene.name }} />}
                data-cy={`scene-row-play-${scene.selector}`}
              >
                <i class="fe fe-play" />
              </button>
            </Localizer>
          )}
        </div>
      </SwipeRow>
    );
  }
}

export default MobileSceneRow;
