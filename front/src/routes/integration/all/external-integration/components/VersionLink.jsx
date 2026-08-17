import { Text, Localizer, withText } from 'preact-i18n';

import { getChangelogUrl } from '../utils';

// A version number of an external integration, linking to that version's
// changelog. Integrations installed from the store or from a repo URL carry
// their `owner/repo` in `store_slug`, which is all it takes to point at the
// release notes; a dev install (Docker image only, no repository) has nothing
// to point at, so its version stays plain text instead of becoming a link
// that leads nowhere.
const VersionLink = ({ storeSlug, version }) => {
  const changelogUrl = getChangelogUrl(storeSlug, version);
  if (!changelogUrl) {
    return <span>{version}</span>;
  }
  return (
    <Localizer>
      <a
        href={changelogUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={<Text id="integration.externalIntegration.supervision.changelogTitle" />}
      >
        {version}
      </a>
    </Localizer>
  );
};

// A translated sentence carrying the integration version, with the version
// number itself turned into a link to its changelog. The sentence is split
// around the already-interpolated version rather than cut into fragments in
// the locale files: where the version sits in the sentence stays the
// translator's business ("mise à jour en version 1.2.0", "auf Version 1.2.0
// aktualisiert"), and the existing translations are left untouched.
const VersionSentenceParts = ({ sentence, storeSlug, version }) => {
  if (typeof sentence !== 'string' || !version || !getChangelogUrl(storeSlug, version)) {
    return sentence;
  }
  return (
    <span>
      {sentence.split(version).map((part, index) => (
        <span>
          {index > 0 && <VersionLink storeSlug={storeSlug} version={version} />}
          {part}
        </span>
      ))}
    </span>
  );
};

// `withText` resolves the sentence (id and fields are per-render values: the
// banner shows a different one depending on the update outcome) into the
// translated string the component above splits.
const VersionSentence = withText(props => ({
  sentence: <Text id={props.id} fields={props.fields} />
}))(VersionSentenceParts);

export { VersionSentence };
export default VersionLink;
