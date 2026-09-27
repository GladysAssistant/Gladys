module.exports = (sequelize, DataTypes) => {
  const alarmCode = sequelize.define('t_alarm_code', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      allowNull: true,
      type: DataTypes.UUID,
      references: {
        model: 't_user',
        key: 'id',
      },
    },
    name: {
      allowNull: true,
      type: DataTypes.STRING,
      validate: {
        len: [1, 40],
      },
    },
    code: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    valid_until: {
      allowNull: true,
      type: DataTypes.DATE,
    },
  });

  // A code with no holder is a guest code, and a guest code without a name is a code nobody can
  // tell apart from another in the list.
  alarmCode.beforeValidate((code) => {
    if (!code.user_id && !code.name) {
      throw new Error('A guest alarm code needs a name');
    }
  });

  // The hash has no business leaving the server, the way t_user hides its password.
  alarmCode.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };
    delete values.code;
    return values;
  };

  alarmCode.associate = (models) => {
    alarmCode.belongsTo(models.User, {
      foreignKey: 'user_id',
      targetKey: 'id',
      as: 'user',
    });
  };

  return alarmCode;
};
