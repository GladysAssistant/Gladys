const { MODEL } = require('../sunspec.constants');
const { readString, readUInt16, readUInt32, readInt16 } = require('./sunspec.utils');

class ModelFactory {
  static readMPPT(data, res, mppt, dcaSf, dcvSf, dcwSf, dcwhSf) {
    let localOffset = res.offset;

    res.mppt.push({});

    res.mppt[mppt].ID = readUInt16(data, localOffset);
    localOffset += 1;
    res.mppt[mppt].IDStr = readString(data, localOffset, 8);
    localOffset += 8;
    res.mppt[mppt].DCA = (readUInt16(data, localOffset) * 10 ** dcaSf).toFixed(2);
    localOffset += 1;
    res.mppt[mppt].DCV = (readUInt16(data, localOffset) * 10 ** dcvSf).toFixed(0);
    localOffset += 1;
    res.mppt[mppt].DCW = (readUInt16(data, localOffset) * 10 ** dcwSf).toFixed(0);
    localOffset += 1;
    // Sunspec = Wh, Gladys kWh
    res.mppt[mppt].DCWH = ((readUInt32(data, localOffset) * 10 ** dcwhSf) / 1000).toFixed(0);
    localOffset += 2;
    res.mppt[mppt].Tms = readUInt32(data, localOffset);
    localOffset += 2;
    res.mppt[mppt].Tmp = readUInt16(data, localOffset);
    localOffset += 1;
    res.mppt[mppt].DCSt = readUInt16(data, localOffset);
    localOffset += 1;
    res.mppt[mppt].DCEvt = readUInt16(data, localOffset);
    localOffset += 2;

    localOffset += 4;

    res.offset = localOffset;

    return res;
  }

  static createModel(data) {
    const type = readUInt16(data, 0);
    // const length = readUInt16(data, 1);

    const res = {};
    switch (type) {
      case MODEL.COMMON:
        res.manufacturer = readString(data, 2, 16);
        res.product = readString(data, 18, 16);
        res.options = readString(data, 34, 8);
        res.swVersion = readString(data, 42, 8);
        res.serialNumber = readString(data, 50, 16);
        break;
      case MODEL.INVERTER_1_PHASE: {
        // eslint-disable-next-line no-case-declarations
        const acaSf = readInt16(data, 6);
        res.ACA = (readUInt16(data, 2) * 10 ** acaSf).toFixed(2);

        // eslint-disable-next-line no-case-declarations
        const acvSf = readInt16(data, 13);
        res.ACV = (readUInt16(data, 10) * 10 ** acvSf).toFixed(0);

        // eslint-disable-next-line no-case-declarations
        const acwSf = readInt16(data, 15);
        res.ACW = (readInt16(data, 14) * 10 ** acwSf).toFixed(0);

        // eslint-disable-next-line no-case-declarations
        // const acfSf = readInt16(data, 17);
        // res.ACF = (readUInt16(data, 16) * 10 ** acfSf).toFixed(0);

        // eslint-disable-next-line no-case-declarations
        // const acvaSf = readInt16(data, 19);
        // res.ACVA = (readInt16(data, 18) * 10 ** acvaSf).toFixed(0);

        // eslint-disable-next-line no-case-declarations
        // const acvarSf = readInt16(data, 21);
        // res.ACVAR = (readInt16(data, 20) * 10 ** acvarSf).toFixed(0);

        // eslint-disable-next-line no-case-declarations
        // const acpfSf = readInt16(data, 13);
        // res.ACPF = (readInt16(data, 22) * 10 ** acpfSf).toFixed(0);

        // eslint-disable-next-line no-case-declarations
        const acwhSf = readInt16(data, 26);
        res.ACWH = ((readUInt32(data, 24) * 10 ** acwhSf) / 1000).toFixed(0);
        break;
      }
      case MODEL.INVERTER_SPLIT_PHASE:
      case MODEL.INVERTER_3_PHASE: {
        // eslint-disable-next-line no-case-declarations
        const acaSf = readInt16(data, 6);
        res.ACA = (readUInt16(data, 2) * 10 ** acaSf).toFixed(2);
        // res.ACA_A = (readUInt16(data, 3) * 10 ** acaSf).toFixed(2);
        // res.ACA_B = (readUInt16(data, 4) * 10 ** acaSf).toFixed(2);
        // res.ACA_C = (readUInt16(data, 5) * 10 ** acaSf).toFixed(2);

        // eslint-disable-next-line no-case-declarations
        const acvSf = readInt16(data, 13);
        // res.ACV_AB = (readUInt16(data, 7) * 10 ** acvSf).toFixed(0);
        // res.ACV_BC = (readUInt16(data, 8) * 10 ** acvSf).toFixed(0);
        // res.ACV_CA = (readUInt16(data, 9) * 10 ** acvSf).toFixed(0);
        // res.ACV_AN = (readUInt16(data, 10) * 10 ** acvSf).toFixed(0);
        // res.ACV_BN = (readUInt16(data, 11) * 10 ** acvSf).toFixed(0);
        // res.ACV_CN = (readUInt16(data, 12) * 10 ** acvSf).toFixed(0);
        const acvA = readUInt16(data, 10) * 10 ** acvSf;
        const acvB = readUInt16(data, 11) * 10 ** acvSf;
        const acvC = readUInt16(data, 12) * 10 ** acvSf;
        res.ACV = ((acvA + acvB + acvC) / 3).toFixed(0);

        // eslint-disable-next-line no-case-declarations
        const acwSf = readInt16(data, 15);
        res.ACW = (readInt16(data, 14) * 10 ** acwSf).toFixed(0);

        // eslint-disable-next-line no-case-declarations
        // const acfSf = readInt16(data, 17);
        // res.ACF = (readUInt16(data, 16) * 10 ** acfSf).toFixed(0);

        // eslint-disable-next-line no-case-declarations
        // const acvaSf = readInt16(data, 19);
        // res.ACVA = (readInt16(data, 18) * 10 ** acvaSf).toFixed(0);

        // eslint-disable-next-line no-case-declarations
        // const acvarSf = readInt16(data, 21);
        // res.ACVAR = (readInt16(data, 20) * 10 ** acvarSf).toFixed(0);

        // eslint-disable-next-line no-case-declarations
        // const acpfSf = readInt16(data, 13);
        // res.ACPF = (readInt16(data, 22) * 10 ** acpfSf).toFixed(0);

        // eslint-disable-next-line no-case-declarations
        const acwhSf = readInt16(data, 26);
        res.ACWH = ((readUInt32(data, 24) * 10 ** acwhSf) / 1000).toFixed(0);
        break;
      }
      case MODEL.MPPT_INVERTER_EXTENSION: {
        const DCA_SF = readInt16(data, 2);
        const DCV_SF = readInt16(data, 3);
        const DCW_SF = readInt16(data, 4);
        const DCWH_SF = readInt16(data, 5);
        res.Evt = readUInt32(data, 6);
        res.N = readUInt16(data, 8);
        res.TmsPer = readUInt16(data, 9);

        res.offset = 10;
        res.mppt = [];

        for (let i = 0; i < Math.min(res.N, 2); i += 1) {
          this.readMPPT(data, res, i, DCA_SF, DCV_SF, DCW_SF, DCWH_SF);
        }

        break;
      }
      default:
        return new Error('Model ID not supported');
    }
    return res;
  }
}

module.exports = {
  ModelFactory,
};
