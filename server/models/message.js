module.exports = (sequelize, DataTypes) => {
  const message = sequelize.define(
    't_message',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      sender_id: {
        allowNull: true,
        type: DataTypes.UUID,
        references: {
          model: 't_user',
          key: 'id',
        },
      },
      receiver_id: {
        allowNull: true,
        type: DataTypes.UUID,
        references: {
          model: 't_user',
          key: 'id',
        },
      },
      text: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      file: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
      conversation_id: {
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      is_read: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      validate: {
        atLeastOneUserId() {
          if (!this.sender_id && !this.receiver_id) {
            throw new Error('sender_id and receiver_id cannot be both null');
          }
        },
      },
    },
  );

  message.associate = (models) => {
    message.belongsTo(models.User, {
      foreignKey: 'sender_id',
      targetKey: 'id',
      as: 'sender',
    });
    message.belongsTo(models.User, {
      foreignKey: 'receiver_id',
      targetKey: 'id',
      as: 'receiver',
    });
  };

  return message;
};
