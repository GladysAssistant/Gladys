import { Fragment } from 'preact';
import cx from 'classnames';

const Requirement = ({ verified, mandatory, children }) => (
  <Fragment>
    <i
      class={cx('requirement', 'fe', 'mr-2', {
        'fe-check-circle text-success': verified,
        'fe-x-circle text-danger': !verified && mandatory,
        'fe-help-circle text-primary': !verified && !mandatory
      })}
    />
    {children}
  </Fragment>
);

export default Requirement;
