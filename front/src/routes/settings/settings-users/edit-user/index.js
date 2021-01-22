import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import EditUserPage from './EditUserPage';
import actions from '../../../../actions/house';
import { getYearsMonthsAndDays } from '../../../../utils/date';

const user = {
  firstname: 'Tony',
  lastname: 'Stark',
  role: 'admin',
  language: 'en',
  email: 'tony.stark@gladysassistant.com',
  img: 'https://pbs.twimg.com/profile_images/813506736854339584/4COxLo7p_400x400.jpg'
};

@connect('', actions)
class SettingsUsers extends Component {
  refreshBirthdate = () => {
    const { days, months, years } = getYearsMonthsAndDays(
      get(this.state, 'newUser.birthdateYear'),
      get(this.state, 'newUser.birthdateMonth')
    );
    this.setState({
      days,
      months,
      years
    });
  };

  constructor() {
    super();
    this.state = {
      years: [],
      days: [],
      months: []
    };
  }

  componentDidMount() {
    this.refreshBirthdate();
  }

  render(props, { days, months, years }) {
    console.log({ days, months, years });
    return <EditUserPage newUser={user} days={days} months={months} years={years} />;
  }
}

export default SettingsUsers;
