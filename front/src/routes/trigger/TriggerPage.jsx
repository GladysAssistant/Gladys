import { connect } from 'unistore/preact';
import TriggerCards from './TriggerCards';
import actions from '../../actions/integration';

const someTriggers = [
  {
    id: '6a37dd9d-48c7-4d09-a7bb-33f257edb78d',
    name: 'Wake Up',
    description: 'If user "Tony" needs to wake up, start scene "Wake Up"',
    icon: 'fe fe-bell',
    img: '/assets/integrations/cover/wemo.jpg'
  },
  {
    id: '064df5f5-6813-4ad5-836c-2967b2b8dcd9',
    name: 'Back At Home',
    description: 'If user "Pepper" is coming back home, start scene "Back At Home"',
    icon: 'fe fe-home',
    img: '/assets/integrations/cover/wemo.jpg'
  }
];

const TriggerPage = connect(
  'user,scenes,totalSize,currentUrl',
  actions
)(({ user, scenes, search, currentUrl }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="page-header">
            <h1 class="page-title">Triggers</h1>
            <div class="page-options d-flex">
              <select class="form-control custom-select w-auto">
                <option value="asc">A - Z</option>
                <option value="desc">Z - A</option>
              </select>
              <div class="input-icon ml-2">
                <span class="input-icon-addon">
                  <i class="fe fe-search" />
                </span>
                <input type="text" class="form-control w-10" placeholder="Search triggers" onInput={search} />
              </div>
              <button class="btn btn-outline-primary ml-2">
                New <i class="fe fe-plus" />
              </button>
            </div>
          </div>
          <div class="row">
            <div class="col-lg-12">
              <TriggerCards scenes={someTriggers} currentUrl={currentUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
));

export default TriggerPage;
