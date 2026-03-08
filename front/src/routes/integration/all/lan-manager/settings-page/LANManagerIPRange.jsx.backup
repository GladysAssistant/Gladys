import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import cx from 'classnames';

import LANManagerIPLine from './LANManagerIPLine';

const IPV4_CIDR_REGEX = /(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}\/(3[0-2]|[12]?[0-9])/;

class LANManagerIPRange extends Component {
  changeNewMaskName = e => {
    const { value } = e.target;
    this.setState({ name: value });
  };

  changeNewMask = e => {
    const { value } = e.target;
    const valid = IPV4_CIDR_REGEX.test(value);
    this.setState({ mask: value, valid });
  };

  addMask = () => {
    const { name, mask } = this.state;
    this.props.addMaskConfig({ name, mask, enabled: true });
    this.setState({ name: '', mask: '', valid: false });
  };

  render({ ipMasks = {}, disabled, updateMaskConfig, deleteMaskConfig }, { name = '', mask = '', valid }) {
    const invalidMask = mask.length > 0 && !valid;
    return (
      <div>
        <div class="form-group">
          <label class="form-label">
            <Text id="integration.lanManager.setup.ipMasksLabel" />
          </label>
          <div class="alert alert-secondary">
            <Text id="integration.lanManager.setup.masksDescription" />
          </div>
          <div class="table-responsive">
            <table class="table table-vcenter card-table table-striped">
              <thead>
                <tr>
                  <th>
                    <Text id="integration.lanManager.setup.maskTableHeader" />
                  </th>
                  <th>
                    <Text id="integration.lanManager.setup.nameTableHeader" />
                  </th>
                  <th>
                    <Text id="integration.lanManager.setup.statusTableHeader" />
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ipMasks.map((mask, maskIndex) => (
                  <LANManagerIPLine
                    ipMask={mask}
                    disabled={disabled}
                    maskIndex={maskIndex}
                    updateMaskConfig={updateMaskConfig}
                    deleteMaskConfig={deleteMaskConfig}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td class="align-top">
                    <div class="form-inline">
                      <Localizer>
                        <input
                          type="text"
                          class={cx('form-control', 'form-control-sm', {
                            'is-invalid': invalidMask
                          })}
                          placeholder={<Text id="integration.lanManager.setup.maskTablePlaceholder" />}
                          disabled={disabled}
                          onChange={this.changeNewMask}
                          value={mask}
                        />
                      </Localizer>
                      <div class="ml-2">
                        <span class="form-required">
                          <Text id="global.requiredField" />
                        </span>
                      </div>
                    </div>
                    {invalidMask && (
                      <div class="invalid-feedback d-block">
                        <Text id="integration.lanManager.setup.maskFormatError" />
                      </div>
                    )}
                  </td>
                  <td class="align-top">
                    <div class="form-inline pb-5">
                      <Localizer>
                        <input
                          type="text"
                          class="form-control form-control-sm"
                          placeholder={<Text id="integration.lanManager.setup.nameTablePlaceholder" />}
                          disabled={disabled}
                          onChange={this.changeNewMaskName}
                          value={name}
                        />
                      </Localizer>
                    </div>
                  </td>
                  <td class="align-top">
                    <button class="btn btn-primary btn-sm" onClick={this.addMask} disabled={disabled || !valid}>
                      <i class="fe fe-plus" />
                    </button>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default LANManagerIPRange;
