import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import CardFilter from '../../../components/layout/CardFilter';
import { RequestStatus } from '../../../utils/consts';
import UserCard from './UserCard';
import PlusOverview from './PlusOverview';
import RemoteAccess from './RemoteAccess';
import style from './style.css';

// Gladys Plus accounts that are not attached to any Gladys user: invitations
// nobody accepted yet, and people who created their Plus account but have not
// picked their Gladys user on their first Plus login. They still need the
// admin (authorize their keys, cancel the invitation…), so they get a row of
// their own under the users.
const UnlinkedPlusUser = ({ remote, ...props }) => (
  <div class={cx('card', style.userCard, style.unlinkedCard)}>
    <div class={style.userHeader}>
      <span class={cx(style.avatar, style.avatarPlaceholder)}>
        <i class="fe fe-user" />
      </span>
      <div class={style.userHeading}>
        <span class={style.userName}>
          {remote.name || remote.email || <Text id="usersSettings.plus.unknownName" />}
        </span>
        {remote.name && remote.email && <span class={style.userMeta}>{remote.email}</span>}
      </div>
    </div>
    <RemoteAccess remote={remote} {...props} />
  </div>
);

const UserPage = ({ children, ...props }) => {
  const { view, plusConfigured, isAdmin, isPlusAdmin, gatewayMode } = props;
  const { members, unlinked, stats } = view;
  // nothing to show yet: the list is loading, not empty
  const loaded = props.users !== null;
  const noResult = loaded && members.length === 0 && unlinked.length === 0;
  const remoteProps = {
    plusConfigured,
    gatewayMode,
    isAdmin,
    isPlusAdmin,
    plusMe: props.plusMe,
    gatewayKeysStatus: props.gatewayKeysStatus,
    switchStatus: props.switchStatus,
    switchUserKey: props.switchUserKey,
    revokeRemote: props.revokeRemote,
    inviteUser: props.inviteUser,
    linkRemote: props.linkRemote,
    resetRemoteTwoFactor: props.resetRemoteTwoFactor,
    generateRemoteRecoveryCodes: props.generateRemoteRecoveryCodes,
    // the "link to a Gladys user" select: every user of the instance, the ones already
    // holding a Gladys Plus account or invitation left out
    users: props.users || [],
    takenUserIds: view.takenUserIds,
    // the Plus account actions wait for the account list: without it, every
    // card would offer an invitation, a second one for people already in
    plusReady: !gatewayMode || props.plusUsersStatus === RequestStatus.Success,
    language: props.user && props.user.language
  };

  return (
    <div>
      <div class="page-header d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-sm-between">
        <div>
          <h1 class="page-title">
            <Text id="usersSettings.title" />
          </h1>
          <p class={style.pageSubtitle}>
            <Text id={plusConfigured ? 'usersSettings.subtitlePlus' : 'usersSettings.subtitle'} />
          </p>
        </div>
        <div class="d-flex align-items-center mt-2 mt-sm-0">
          <div class="d-flex">
            <Localizer>
              <CardFilter
                changeOrderDir={props.changeOrderDir}
                orderValue={props.orderDir}
                search={props.search}
                searchValue={props.searchTerms}
                searchPlaceHolder={<Text id="usersSettings.searchPlaceholder" />}
              />
            </Localizer>
          </div>
          {isAdmin && (
            <Link href="/dashboard/settings/user/new" class="btn btn-outline-primary ml-2 flex-shrink-0">
              <span class="d-none d-lg-inline-block mr-2">
                <Text id="usersSettings.newUserButton" />
              </span>
              <i class="fe fe-plus" />
            </Link>
          )}
        </div>
      </div>

      {plusConfigured && (
        <PlusOverview
          stats={stats}
          gatewayMode={gatewayMode}
          gatewayKeysStatus={props.gatewayKeysStatus}
          plusUsersStatus={props.plusUsersStatus}
        />
      )}

      {props.revokeError && (
        <div class="alert alert-danger" role="alert">
          <Text id="usersSettings.plus.revokeError" />
        </div>
      )}
      {props.switchStatus === RequestStatus.Error && (
        <div class="alert alert-danger" role="alert">
          <Text id="usersSettings.plus.switchError" />
        </div>
      )}

      <div class={cx('dimmer', { active: props.loading })} style={{ minHeight: '12rem' }}>
        <div class="loader" />
        <div class="dimmer-content">
          {noResult && (
            <div class="alert alert-secondary">
              <Text id="usersSettings.noUsersFound" />
            </div>
          )}
          {members.length > 0 && (
            <div class={style.listSummary}>
              <Text
                id={stats.users === 1 ? 'usersSettings.oneUserCount' : 'usersSettings.userCount'}
                fields={{ count: stats.users }}
              />
            </div>
          )}
          <div class={style.userList}>
            {members.map(({ user, remote }) => (
              <UserCard
                key={user.id}
                user={user}
                remote={remote}
                loggedUser={props.user}
                deleteUser={props.deleteUser}
                remoteProps={remoteProps}
              />
            ))}
          </div>

          {unlinked.length > 0 && (
            <section class={style.unlinkedSection}>
              <div class={style.listSummary}>
                <Text id="usersSettings.plus.unlinkedTitle" />
              </div>
              <p class={style.sectionHint}>
                <Text id="usersSettings.plus.unlinkedHint" />
              </p>
              <div class={style.userList}>
                {unlinked.map(remote => (
                  <UnlinkedPlusUser key={remote.id} remote={remote} {...remoteProps} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPage;
