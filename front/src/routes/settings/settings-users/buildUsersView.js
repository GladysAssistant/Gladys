// One list to rule them all: the Gladys users of the instance, the Gladys Plus
// users of the account (gateway mode only: the browser holds the Plus token)
// and the encryption keys the instance knows (its "remote users" list) used to
// live on three different pages. This builds the single view the Users page
// renders: every Gladys user with their remote access state, plus the Gladys
// Plus accounts that are not attached to any Gladys user yet.
//
// A Gladys Plus user is attached to a Gladys user by `gladys_4_user_id`
// (authoritative): set by the admin when they invite someone from a user's
// card (the invitation carries it, the account created from it inherits it),
// or picked by the user on their first Gladys Plus login for accounts created
// before that. Without a link, the email is the only clue: an invitation or a
// Plus account with the same email as a Gladys user is shown on that user's
// card, so the admin sees the whole journey (invited → account created →
// linked → authorized) in one place.

export const REMOTE_STATUS = {
  // keys accepted on the instance, Plus account linked to this Gladys user
  AUTHORIZED: 'authorized',
  // keys changed (Gladys Plus password reset) since they were accepted
  KEYS_CHANGED: 'keys_changed',
  // keys known by the instance, never accepted (or revoked)
  PENDING: 'pending',
  // Plus account exists but the user has not picked their Gladys user yet
  NOT_LINKED: 'not_linked',
  // invitation sent, the Plus account does not exist yet
  INVITED: 'invited',
  // no Plus account, no invitation
  NONE: 'none'
};

// the admin has something to do for these
export const ACTION_NEEDED_STATUSES = [REMOTE_STATUS.PENDING, REMOTE_STATUS.KEYS_CHANGED];

const normalizeEmail = email => (typeof email === 'string' ? email.trim().toLowerCase() : null);

const getStatus = remote => {
  if (remote.isInvitation) {
    return REMOTE_STATUS.INVITED;
  }
  if (remote.keys) {
    if (!remote.keys.accepted) {
      return remote.keys.keys_changed ? REMOTE_STATUS.KEYS_CHANGED : REMOTE_STATUS.PENDING;
    }
    return remote.linked ? REMOTE_STATUS.AUTHORIZED : REMOTE_STATUS.NOT_LINKED;
  }
  return REMOTE_STATUS.NOT_LINKED;
};

const finalize = (remote, linked) => {
  const withLink = { ...remote, linked };
  return { ...withLink, status: getStatus(withLink) };
};

const matchesSearch = (search, ...values) => {
  if (!search) {
    return true;
  }
  const needle = search.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return values.some(value => typeof value === 'string' && value.toLowerCase().includes(needle));
};

/**
 * @description Build the view of the Users page.
 * @param {object} params - Parameters.
 * @param {Array} params.users - The Gladys users of the instance.
 * @param {Array} [params.gatewayKeys] - The encryption keys known by the instance (GET /api/v1/gateway/key).
 * @param {Array} [params.plusUsers] - The users and invitations of the Gladys Plus account.
 * @param {string} [params.search] - Text typed in the search box.
 * @param {string} [params.orderDir] - 'asc' or 'desc', on the user's name.
 * @returns {object} The members, the unattached Gladys Plus accounts and the counters.
 * @example
 * buildUsersView({ users, gatewayKeys, plusUsers });
 */
export function buildUsersView({ users = [], gatewayKeys, plusUsers, search = '', orderDir = 'asc' }) {
  const remotes = new Map();
  (gatewayKeys || []).forEach((keys, keysIndex) => {
    remotes.set(keys.id, {
      id: keys.id,
      name: keys.name,
      email: null,
      keys,
      keysIndex,
      gladysUserId: keys.gladys_4_user_id || null,
      account: null,
      isInvitation: false,
      attached: false
    });
  });
  const invitations = [];
  (plusUsers || []).forEach(plusUser => {
    if (plusUser.is_invitation) {
      invitations.push({
        id: plusUser.id,
        name: plusUser.name || null,
        email: normalizeEmail(plusUser.email),
        gladysUserId: plusUser.gladys_4_user_id || null,
        keys: null,
        keysIndex: -1,
        account: plusUser,
        isInvitation: true,
        attached: false
      });
      return;
    }
    const remote = remotes.get(plusUser.id) || {
      id: plusUser.id,
      name: plusUser.name,
      keys: null,
      keysIndex: -1,
      isInvitation: false,
      attached: false
    };
    remote.account = plusUser;
    remote.name = plusUser.name || remote.name;
    remote.email = normalizeEmail(plusUser.email);
    remote.gladysUserId = plusUser.gladys_4_user_id || remote.gladysUserId || null;
    remotes.set(plusUser.id, remote);
  });
  const remoteList = Array.from(remotes.values());

  const members = users.map(user => {
    const email = normalizeEmail(user.email);
    const linked = candidate => !candidate.attached && candidate.gladysUserId === user.id;
    const sameEmail = candidate => !candidate.attached && email !== null && candidate.email === email;
    // the link wins over the email, an account over an invitation
    const match =
      remoteList.find(linked) || invitations.find(linked) || remoteList.find(sameEmail) || invitations.find(sameEmail);
    let remote = null;
    if (match) {
      match.attached = true;
      remote = finalize(match, match.gladysUserId === user.id);
    }
    return { user, remote };
  });

  const unlinked = remoteList
    .concat(invitations)
    .filter(remote => !remote.attached)
    .map(remote => finalize(remote, false));

  const stats = {
    users: users.length,
    authorized: 0,
    actionNeeded: 0,
    invited: 0,
    notLinked: 0
  };
  members
    .map(member => member.remote)
    .concat(unlinked)
    .filter(Boolean)
    .forEach(remote => {
      if (remote.status === REMOTE_STATUS.AUTHORIZED) {
        stats.authorized += 1;
      } else if (ACTION_NEEDED_STATUSES.includes(remote.status)) {
        stats.actionNeeded += 1;
      } else if (remote.status === REMOTE_STATUS.INVITED) {
        stats.invited += 1;
      } else if (remote.status === REMOTE_STATUS.NOT_LINKED) {
        stats.notLinked += 1;
      }
    });

  const direction = orderDir === 'desc' ? -1 : 1;
  const fullName = user => `${user.firstname || ''} ${user.lastname || ''}`.trim();
  const sortedMembers = members
    .filter(({ user, remote }) =>
      matchesSearch(search, fullName(user), user.email, remote && remote.name, remote && remote.email)
    )
    .sort((a, b) => direction * fullName(a.user).localeCompare(fullName(b.user), undefined, { sensitivity: 'base' }));
  const filteredUnlinked = unlinked.filter(remote => matchesSearch(search, remote.name, remote.email));

  return { members: sortedMembers, unlinked: filteredUnlinked, stats };
}
