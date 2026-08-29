import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import BaseEditBox from '../baseEditBox';
import actions from '../../../actions/dashboard/boxActions';

const DAYS_AHEAD_OPTIONS = [15, 30, 60];
const DEFAULT_DAYS_AHEAD = 30;

const EditCinemaBox = ({ ...props }) => {
  const updateDaysAhead = e => {
    props.updateBoxConfig(props.x, props.y, {
      days_ahead: Number(e.target.value)
    });
  };
  return (
    <BaseEditBox {...props} titleKey="dashboard.boxTitle.cinema">
      <Text id="dashboard.boxes.cinema.description" />
      <div class="form-group mt-3">
        <label>
          <Text id="dashboard.boxes.cinema.daysAheadLabel" />
        </label>
        <select onChange={updateDaysAhead} class="form-control">
          {DAYS_AHEAD_OPTIONS.map(daysAhead => (
            <option
              key={daysAhead}
              value={daysAhead}
              selected={(props.box.days_ahead || DEFAULT_DAYS_AHEAD) === daysAhead}
            >
              <Text id={`dashboard.boxes.cinema.daysAhead${daysAhead}`} />
            </option>
          ))}
        </select>
      </div>
    </BaseEditBox>
  );
};

export default connect('httpClient', actions)(EditCinemaBox);
