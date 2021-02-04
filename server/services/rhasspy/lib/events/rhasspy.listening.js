const logger = require('../../../../utils/logger');
const WebSocket = require('ws');
const axios = require('axios');

/**
 * @description Listen websocket
 * @example
 * listening();
 */
async function listening() {
  const ws = new WebSocket('ws://localhost:12101/api/events/intent');
  ws.on('open', function open() {
  });
  ws.on('message', async (data) => {
    obj = JSON.parse(data);
    const response = await this.gladys.message.getReply(obj.text, 'en');
    await axios.post('http://0.0.0.0:12101/api/text-to-speech?play=true', response);
  });
}

module.exports = {
  listening,
};
