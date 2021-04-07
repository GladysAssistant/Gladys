const disconnectAll = async function disconnectAll() {
  const params = {
    service: 'lgtv',
  };
  const devices = await this.gladys.device.get(params);

  await Promise.all(devices.map((device) => this.disconnect(device)));
};

module.exports = disconnectAll;
