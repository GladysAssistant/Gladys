import { Text, Localizer } from 'preact-i18n';
import SettingsLayout from '../SettingsLayout';
import { Link } from 'preact-router/match';

const UserPage = ({ children, ...props }) => (
  <SettingsLayout>
    <div class="page-header">
      <h1 class="page-title">
        <Text id="usersSettings.title" />
      </h1>
      <div class="page-options d-flex">
        <select class="form-control custom-select w-auto">
          <option value="asc">
            <Text id="global.orderDirAsc" />
          </option>
          <option value="desc">
            <Text id="global.orderDirDesc" />
          </option>
        </select>
        <div class="input-icon ml-2">
          <span class="input-icon-addon">
            <i class="fe fe-search" />
          </span>
          <Localizer>
            <input
              type="text"
              class="form-control w-10"
              placeholder={<Text id="usersSettings.searchPlaceholder" />}
              value={props.SettingsLayoutsearchKeyword}
              onInput={this.searchWithI18n}
            />
          </Localizer>
        </div>
        <Link href="/dashboard/settings/user/new" class="btn btn-outline-primary ml-2">
          <Text id="usersSettings.newUserButton" /> <i class="fe fe-plus" />
        </Link>
      </div>
    </div>
    <div class="row">
      <div class="col-lg-12">
        <div class="row row-cards">
          {props.users &&
            props.users.map(user => (
              <div class="col-md-4">
                <div class="card">
                  <div class="card-body p-4 text-center">
                    <span
                      class="avatar avatar-xl mb-3 avatar-rounded"
                      style={{ backgroundImage: `url(${user.picture})` }}
                    />
                    <h3 class="m-0 mb-1">
                      {user.firstname} {user.lastname}
                    </h3>
                    <div class="mt-3">
                      <span class="tag tag-green">{user.role}</span>
                    </div>
                  </div>
                  <div class="card-footer">
                    <a href={`/dashboard/settings/user/edit/${user.selector}`} class="btn btn-secondary">
                      <Text id="usersSettings.editUserButton" />
                    </a>
                    <button class="btn btn-danger btn-outline float-right">
                      <Text id="usersSettings.deleteUserButton" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  </SettingsLayout>
);

export default UserPage;
