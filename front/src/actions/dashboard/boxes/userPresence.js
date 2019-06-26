import { RequestStatus } from '../../../utils/consts';
import update from 'immutability-helper';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

function createActions(store) {
  const actions = {
    userChanged(state, user) {
      const userIndex = state.usersWithPresence.findIndex(u => u.selector === user.selector);
      // if user is not found, we refresh the box
      if (userIndex === -1) {
        return actions.getUsersWithPresence(state);
      }
      // if not, we update it
      const newState = update(state, {
        usersWithPresence: {
          [userIndex]: {
            $merge: user
          }
        }
      });
      store.setState(newState);
    },
    async getUsersWithPresence(state) {
      store.setState({
        DashboardUserPresenceGetUsersStatus: RequestStatus.Getting
      });
      try {
        const usersWithPresence = await state.httpClient.get(
          '/api/v1/user?fields=firstname,lastname,role,selector,picture,current_house_id,last_house_changed'
        );
        // calculate relative date
        usersWithPresence.forEach(user => {
          if (user.last_house_changed) {
            user.last_house_changed_relative_to_now = dayjs(user.last_house_changed)
              .locale(state.user.language)
              .fromNow();
          }
        });
        store.setState({
          usersWithPresence,
          DashboardUserPresenceGetUsersStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          DashboardUserPresenceGetUsersStatus: RequestStatus.Error
        });
      }
    }
  };
  return actions;
}

export default createActions;
