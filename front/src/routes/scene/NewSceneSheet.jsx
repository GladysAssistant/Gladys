import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { route } from 'preact-router';
import cx from 'classnames';
import get from 'get-value';

import BottomSheet from '../../components/sheet/BottomSheet';
import withIntlAsProp from '../../utils/withIntlAsProp';
import guessSceneIcon from './guessSceneIcon';
import style from './mobile.css';

/**
 * @description Creating a scene on a phone (docs/specs/scene-editor-mobile.md, D.4): the name
 * only, the icon guessed from it (and changed later in the scene settings). The editor then opens
 * on the trigger picker (?new=1).
 */
class NewSceneSheet extends Component {
  state = {
    name: '',
    status: null
  };

  componentDidMount() {
    this.focusIfOpen();
  }

  componentDidUpdate(prevProps) {
    if (this.props.open && !prevProps.open) {
      this.focusIfOpen();
    }
  }

  // the name is the only field: the keyboard comes up with the sheet
  focusIfOpen = () => {
    if (!this.props.open) {
      return;
    }
    setTimeout(() => {
      if (this.input) {
        this.input.focus({ preventScroll: true });
      }
    }, 50);
  };

  setInputRef = element => {
    this.input = element;
  };

  updateName = e => {
    this.setState({ name: e.target.value, status: null });
  };

  create = async e => {
    if (e) {
      e.preventDefault();
    }
    const name = this.state.name.trim();
    // "new" is the route of the creation page, not a valid scene selector
    if (!name || name.toLowerCase() === 'new') {
      this.setState({ status: 'invalid' });
      return;
    }
    this.setState({ status: 'creating' });
    try {
      const createdScene = await this.props.httpClient.post('/api/v1/scene', {
        name,
        icon: guessSceneIcon(name),
        actions: [[]],
        tags: []
      });
      this.props.onClose();
      route(`/dashboard/scene/${createdScene.selector}?new=1`);
    } catch (error) {
      this.setState({ status: get(error, 'response.status') === 409 ? 'conflict' : 'error' });
    }
  };

  render({ open, onClose, intl }, { name, status }) {
    return (
      <BottomSheet
        open={open}
        title={get(intl.dictionary, 'scene.mobile.newSceneTitle')}
        onClose={onClose}
        dataCy="scene-new-sheet"
      >
        <form onSubmit={this.create}>
          <label class={style.sheetLabel} for="scene-new-name">
            <Text id="newScene.nameLabel" />
          </label>
          <Localizer>
            <input
              id="scene-new-name"
              ref={this.setInputRef}
              type="text"
              class={style.textField}
              value={name}
              onInput={this.updateName}
              placeholder={<Text id="scene.mobile.newScenePlaceholder" />}
              autocomplete="off"
              enterkeyhint="go"
              data-cy="scene-new-name"
            />
          </Localizer>
          {status === 'invalid' && (
            <p class={style.fieldError}>
              <Text id="newScene.invalidName" />
            </p>
          )}
          {status === 'conflict' && (
            <p class={style.fieldError}>
              <Text id="newScene.sceneAlreadyExist" />
            </p>
          )}
          {status === 'error' && (
            <p class={style.fieldError}>
              <Text id="scene.mobile.createError" />
            </p>
          )}
          <div class={style.newSceneIcon}>
            <span class={style.sceneTile} aria-hidden="true">
              <i class={`fe fe-${guessSceneIcon(name)}`} />
            </span>
            <span>
              <Text id="scene.mobile.iconGuessed" />
            </span>
          </div>
          <button
            type="submit"
            class={cx(style.bigButton, style.bigButtonPrimary)}
            disabled={!name.trim() || status === 'creating'}
            data-cy="scene-new-create"
          >
            <Text id="scene.mobile.createAndChooseTrigger" />
          </button>
        </form>
      </BottomSheet>
    );
  }
}

export default withIntlAsProp(NewSceneSheet);
