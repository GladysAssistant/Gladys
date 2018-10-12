module.exports = {
  attributes: {
    datetime: {
      type: 'datetime'
    },

    sender: {
      model: 'user'
    },

    receiver: {
      model: 'user'
    },

    text: {
      type: 'text'
    },

    conversation: {
      type: 'uuid'
    },

    service: {
      type: 'string'
    },

    isRead: {
      type: 'boolean',
      defaultsTo: false
    }
  }
};
