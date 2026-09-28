const { BadParameters } = require('../../utils/coreErrors');

// The `ext:` namespace of external_id is reserved to the external
// integrations (C.2), whose calendar and event ids are user-scoped
// (`ext:<selector>:<user_selector>:`, capabilities/calendar-type.md). The
// columns are globally UNIQUE: a calendar or an event created by hand must
// never squat one of those ids, or the next push of the user it names would
// hit a conflict on a row they do not own.
const RESERVED_EXTERNAL_ID_PREFIX = 'ext:';

/**
 * @description Refuse an external_id of the namespace reserved to the
 * external integrations.
 * @param {*} externalId - The external_id to check (absent is fine).
 * @example
 * assertNotReservedExternalId(calendar.external_id);
 */
function assertNotReservedExternalId(externalId) {
  if (typeof externalId === 'string' && externalId.startsWith(RESERVED_EXTERNAL_ID_PREFIX)) {
    throw new BadParameters(
      `external_id: the "${RESERVED_EXTERNAL_ID_PREFIX}" prefix is reserved to the external integrations`,
    );
  }
}

module.exports = {
  assertNotReservedExternalId,
};
