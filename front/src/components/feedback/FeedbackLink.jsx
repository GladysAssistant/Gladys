import { Text, withText } from 'preact-i18n';
import { connect } from 'unistore/preact';
import { getFrontVersion } from '../../utils/instanceVersion';
import { buildForumFeedbackUrl, getFeedbackVersion } from '../../utils/forumFeedback';

// A link that opens a pre-filled "give your feedback" topic on the community
// forum (see utils/forumFeedback). With a `subject` (the integration whose
// page the user is on), the topic is about it; without one, it is about
// Gladys in general. The version goes in the body so the team knows which
// release the feedback is about, and the "Sent from Gladys" signature tells
// those topics apart on the forum (that is how the team can count them).
// That version is the instance's when the header has read it: on Gladys Plus
// the hosted front can be a release ahead of the instance for up to a day
// (see components/header/InstanceUpdateNotice), and the feedback is about
// the instance. Otherwise the front's: on a local instance both are the same
// build, and the header stops reading the instance version once it has
// caught up with the front.

const FeedbackAnchor = ({ topicTitle, topicBody, className, dataCy, children }) => (
  <a
    href={buildForumFeedbackUrl({ title: topicTitle, body: topicBody })}
    target="_blank"
    rel="noopener noreferrer"
    class={className}
    data-cy={dataCy}
  >
    {children}
  </a>
);

// Second step: the topic title and body, translated in the user's language,
// with the subject name and the version as fields.
const FeedbackAnchorWithTopic = withText(({ subjectName, instanceGladysVersion }) => ({
  topicTitle: subjectName ? (
    <Text id="feedback.subjectTopicTitle" fields={{ subject: subjectName }} />
  ) : (
    <Text id="feedback.generalTopicTitle" />
  ),
  topicBody: (
    <Text id="feedback.topicBody" fields={{ version: getFeedbackVersion(instanceGladysVersion, getFrontVersion()) }} />
  )
}))(FeedbackAnchor);

// First step: the subject as a plain string. The integration pages give their
// title as a <Text /> node, which withText resolves; an external integration
// gives its display name as a string, used as is (withText would take a
// string for a translation key) — except while the name is loading, when the
// page shows a non-breaking space: a blank name falls back to the topic about
// Gladys rather than "My feedback on the   integration".
const isTextNode = node => Boolean(node) && node.type === Text;

const ResolveSubject = ({ subject, subjectText, ...props }) => (
  <FeedbackAnchorWithTopic {...props} subjectName={typeof subject === 'string' ? subject.trim() : subjectText} />
);

const FeedbackLink = connect('instanceGladysVersion')(
  withText(({ subject }) => (isTextNode(subject) ? { subjectText: subject } : {}))(ResolveSubject)
);

export default FeedbackLink;
