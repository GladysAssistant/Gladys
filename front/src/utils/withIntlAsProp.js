import { IntlContext } from 'preact-i18n';

const withIntlAsProp = WrappedComponent => props => (
  <IntlContext.Consumer>{({ intl }) => <WrappedComponent intl={intl} {...props} />}</IntlContext.Consumer>
);

export default withIntlAsProp;
