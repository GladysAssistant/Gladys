import { Fragment } from 'preact';
import cx from 'classnames';

const Requirement = ({ verified, mandatory, children }) => (
  <Fragment>
    <i
      class={cx('requirement', 'mr-2', {
        'icon-circle-check text-success': verified,
        'icon-circle-x text-danger': !verified && mandatory,
        'icon-circle-help text-primary': !verified && !mandatory
      })}
    />
    {children}
  </Fragment>
);

export default Requirement;
