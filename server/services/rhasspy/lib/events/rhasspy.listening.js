const axios = require('axios');
const WebSocket = require('ws');

/**
 * @description Listen websocket
 * @example
 * listening();
 */
async function listening() {
  const ws = new WebSocket('ws://localhost:12101/api/events/intent');
  ws.on('message', async (data) => {
    const obj = JSON.parse(data);
    const response = await this.gladys.message.getReply(obj.text, 'en');
    try {
      await axios.post('http://0.0.0.0:12101/api/text-to-speech?play=true', response);
    }
    catch (e) {
      logger.debug(`Rhasspy reponse: ${response}`);
    }
  });
}

module.exports = {
  listening,
};
