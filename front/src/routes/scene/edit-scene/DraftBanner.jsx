import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import get from 'get-value';

import RelativeTime from '../../../components/device/RelativeTime';
import style from '../mobile.css';

// A local draft of this scene was found (docs/specs/scene-editor-mobile.md, C.2): restore it or
// discard it. Shown by the desktop and the mobile editor alike.
const DraftBanner = ({ draft, onRestore, onDiscard, user }) =>
  draft ? (
    <div class={style.banner} role="status" data-cy="scene-draft-banner">
      <span>
        <Text id="editScene.mobile.draftFound" />{' '}
        <RelativeTime datetime={draft.saved_at} language={get(user, 'language') || 'en'} futureDisabled />
      </span>
      <div class={style.bannerButtons}>
        <button
          type="button"
          class={cx(style.bigButton, style.bigButtonPrimary)}
          onClick={onRestore}
          data-cy="scene-draft-restore"
        >
          <Text id="editScene.mobile.restoreDraft" />
        </button>
        <button type="button" class={cx(style.bigButton, style.bigButtonNeutral)} onClick={onDiscard}>
          <Text id="editScene.mobile.discardDraft" />
        </button>
      </div>
    </div>
  ) : null;

export default connect('user', {})(DraftBanner);
