import { Text, Localizer } from 'preact-i18n';
import { RequestStatus } from '../../../../utils/consts';
import AndroidTVBox from './AndroidTVBox';
import EmptyState from './EmptyState';
import cx from 'classnames';

const AndroidTVPage = ({ ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-12">
              <div class="card">
                <div class="card-header">
                  <h1 class="card-title">
                    <Text id="integration.androidTV.title" />
                  </h1>
                  <div class="page-options d-flex">
                    <select onChange={props.changeOrderDir} class="form-control custom-select w-auto">
                      <option value="asc">
                        <Text id="global.orderDirAsc" />
                      </option>
                      <option value="desc">
                        <Text id="global.orderDirDesc" />
                      </option>
                    </select>
                    <div class="input-icon ml-2">
                      <span class="input-icon-addon">
                        <i class="fe fe-search" />
                      </span>
                      <Localizer>
                        <input
                          type="text"
                          class="form-control w-10"
                          placeholder={<Text id="integration.androidTV.search" />}
                          onInput={props.debouncedSearch}
                        />
                      </Localizer>
                    </div>
                    <button onClick={(state) => props.addAndroidTV(state, props.intl)}
                      class="btn btn-outline-primary ml-2">
                      <Text id="scene.newButton" /> <i class="fe fe-plus" />
                    </button>
                  </div>
                </div>
                <div class="card-body">
                  <div
                    class={cx('dimmer', {
                      active: props.getAndroidTVStatus === RequestStatus.Getting
                    })}
                  >
                    <div class="loader" />
                    <div class={cx('dimmer-content')}>
                      <div class="row">
                        {props.androidTVs &&
                          props.androidTVs.map((androidTV, index) => (
                            <AndroidTVBox
                              androidTV={androidTV}
                              androidTVIndex={index}
                              housesWithRooms={props.housesWithRooms}
                              updateAndroidTVField={props.updateAndroidTVField}
                              updateAndroidTVIP={props.updateAndroidTVIP}
                              saveAndroidTV={props.saveAndroidTV}
                              deleteAndroidTV={props.deleteAndroidTV}
                              sendCode={props.sendCode}
                              reconnect={props.reconnect}
                            />
                          ))}
                        {props.androidTVs && props.androidTVs.length === 0 && <EmptyState />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AndroidTVPage;
