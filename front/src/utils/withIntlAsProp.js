import { IntlContext } from 'preact-i18n';

const withIntlAsProp = WrappedComponent =>
  function WithIntlAsPropComponent(props) {
    return <IntlContext.Consumer>{({ intl }) => <WrappedComponent intl={intl} {...props} />}</IntlContext.Consumer>;
  };

export default withIntlAsProp;
