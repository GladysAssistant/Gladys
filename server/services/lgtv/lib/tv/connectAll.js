const connectAll = async function connectAll() {
  const params = {
    service: 'lgtv',
  };
  const devices = await this.gladys.device.get(params);

  await Promise.all(devices.map((device) => this.connect(device)));
};

module.exports = connectAll;
