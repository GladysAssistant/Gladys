module.exports = async function(data, rawMessage, cb) {

  try {
    const enableOpenApi = await gladys.param.getValue('GLADYS_GATEWAY_ENABLE_OPEN_API');
    if(enableOpenApi !== 'true') {
      throw new Error('Gladys Gateway Open API not enabled');
    }
  } catch(e) {
    sails.log.warn(`Your instance does not have Gladys Gateway Open API activated. Please activate it.`);
        
    return cb({
      status: 403,
      error_code: 'GLADYS_GATEWAY_OPEN_API_NOT_ACTIVATED',
      error_message: 'You need to activate the Gladys Gateway Open API'
    });
  }

  const user = await gladys.user.getById({ id: rawMessage.data.user });
  
  try {
    switch(rawMessage.action) {
    case 'create-message':
      await gladys.brain.classify(user, { text: rawMessage.data.text });
      cb({ success: true });
      break;
    case 'create-event':
      const newEvent = await gladys.event.create(rawMessage.data);
      cb(newEvent);
      break;
    } 
  } catch (e) {
    sails.log.warn(e);
    cb({
      status: 500,
      error_code: 'SERVER_ERROR',
      error_message: e
    });
  }
};