import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import CardFilter from '../../../components/layout/CardFilter';
import UserCard from './UserCard';

const UserPage = ({ children, ...props }) => (
  <div>
    <div class="page-header">
      <h1 class="page-title">
        <Text id="usersSettings.title" />
      </h1>
      <div class="page-options d-flex">
        <Localizer>
          <CardFilter
            changeOrderDir={props.changeOrderDir}
            orderValue={props.getUsersOrderDir}
            search={props.search}
            searchValue={props.userSearchTerms}
            searchPlaceHolder={<Text id="usersSettings.searchPlaceholder" />}
          />
        </Localizer>
        <Link href="/dashboard/settings/user/new" class="btn btn-outline-primary ml-2">
          <Text id="usersSettings.newUserButton" /> <i class="fe fe-plus" />
        </Link>
      </div>
    </div>
    <div class={props.loading ? 'dimmer active' : 'dimmer'} style={{ minHeight: '20rem' }}>
      <div class="loader" />
      <div class="dimmer-content">
        <div class="row">
          <div class="col-lg-12">
            {props.users && props.users.length === 0 && (
              <div class="alert alert-secondary">
                <Text id="usersSettings.noUsersFound" />
              </div>
            )}
            <div class="row row-cards">
              {props.users &&
                props.users.map((user, index) => (
                  <div class="col-md-4" key={user.id}>
                    <UserCard
                      user={user}
                      loggedUser={props.user}
                      removeUserFromList={props.removeUserFromList}
                      index={index}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default UserPage;
