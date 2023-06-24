const { trimString } = require('./sunspec.utils');

class ModelFactory {
  static readMPPT(data, res, mppt, dcaSf, dcvSf, dcwSf, dcwhSf) {
    let localOffset = res.offset;

    res.mppt.push({});

    res.mppt[mppt].ID = data.readUInt16BE(localOffset);
    localOffset += 2;
    res.mppt[mppt].IDStr = trimString(data.subarray(localOffset, localOffset + 16).toString());
    localOffset += 16;
    res.mppt[mppt].DCA = (data.readUInt16BE(localOffset) * 10 ** dcaSf).toFixed(2);
    localOffset += 2;
    res.mppt[mppt].DCV = (data.readUInt16BE(localOffset) * 10 ** dcvSf).toFixed(0);
    localOffset += 2;
    res.mppt[mppt].DCW = (data.readUInt16BE(localOffset) * 10 ** dcwSf).toFixed(0);
    localOffset += 2;
    res.mppt[mppt].DCWH = (data.readUInt32BE(localOffset) * 10 ** dcwhSf).toFixed(0);
    localOffset += 2;
    res.mppt[mppt].Tms = data.readUInt32BE(localOffset);
    localOffset += 4;
    res.mppt[mppt].Tmp = data.readUInt16BE(localOffset);
    localOffset += 2;
    res.mppt[mppt].DCSt = data.readUInt16BE(localOffset);
    localOffset += 2;
    res.mppt[mppt].DCEvt = data.readUInt16BE(localOffset);
    localOffset += 2;

    localOffset += 4;

    res.offset = localOffset;

    return res;
  }

  static createModel(data) {
    const type = data.readUInt16BE(0);

    // const length = data.readUInt16BE(2);

    let offset = 4;

    const res = {};
    switch (type) {
      case 1:
        res.manufacturer = trimString(data.subarray(4, 36).toString());
        res.product = trimString(data.subarray(36, 36 + 48).toString());
        res.swVersion = trimString(data.subarray(84, 84 + 16).toString());
        res.serialNumber = trimString(data.subarray(100, 100 + 32).toString());
        break;
      case 160: {
        const DCA_SF = data.readInt16BE(offset);
        offset += 2;
        const DCV_SF = data.readInt16BE(offset);
        offset += 2;
        const DCW_SF = data.readInt16BE(offset);
        offset += 2;
        const DCWH_SF = data.readInt16BE(offset);
        offset += 2;
        res.Evt = data.readUInt32BE(offset);
        offset += 4;
        res.N = data.readUInt16BE(offset);
        offset += 2;
        res.TmsPer = data.readUInt16BE(offset);
        offset += 2;

        res.offset = offset;
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
