import { connect } from 'unistore/preact';
import actions from '../../../actions/integration';
import ActionColumn from './ActionColumn';
import { Link } from 'preact-router/match';

const actionsColumns = [
  {
    actions: [
      {
        type: 'Lock the door',
        icon: 'fe fe-lock'
      },
      {
        type: 'Lock the windows',
        icon: 'fe fe-lock'
      }
    ]
  },
  {
    actions: [
      {
        type: 'Wait',
        icon: 'fe fe-clock'
      }
    ]
  },
  {
    actions: [
      {
        type: 'Arm Home',
        icon: 'fe fe-home'
      }
    ]
  }
];

const ScenePage = connect(
  'user,scenes,totalSize',
  actions
)(({ user, scenes, search }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="page-header">
            <h1
              class="page-title"
              style={{
                marginRight: '20px'
              }}
            >
              <Link href="/dashboard/scene" class="btn btn-secondary btn-sm btn-block">
                ◀️️ Back
              </Link>
            </h1>
            <h1 class="page-title">Leaving home</h1>
            <div class="page-options d-flex">
              <button class="btn btn-sm btn-primary ml-2">
                Run <i class="fe fe-play" />
              </button>
              <button class="btn btn-sm btn-danger ml-2">
                Delete <i class="fe fe-trash" />
              </button>
            </div>
          </div>
          <div class="row">
            <div class="col">
              <div class="card">
                <div class="card-body">
                  <div class="row flex-nowrap" style="overflow-x: auto;">
                    {actionsColumns.map((actionColumn, index) => (
                      <ActionColumn actions={actionColumn.actions} index={index} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
));

export default ScenePage;
