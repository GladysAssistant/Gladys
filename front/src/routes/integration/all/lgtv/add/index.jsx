import { connect } from 'unistore/preact';
import actions from '../actions';
import AddTab from './AddTab';
import LGTVPage from '../LGTVPage';
import { useEffect } from 'preact/hooks';

const LGTVDiscoverPage = connect(
  'user,houses',
  actions
)(props => {
  useEffect(() => {
    props.getHouses();
    props.getIntegrationByName('lgtv');
  }, []);

  return (
    <LGTVPage user={props.user}>
      <AddTab {...props} />
    </LGTVPage>
  );
});

export default LGTVDiscoverPage;
