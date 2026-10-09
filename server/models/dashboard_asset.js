module.exports = (sequelize, DataTypes) => {
  const dashboardAsset = sequelize.define('t_dashboard_asset', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    dashboard_id: {
      allowNull: false,
      type: DataTypes.UUID,
      references: {
        model: 't_dashboard',
        key: 'id',
      },
    },
    content_type: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    data: {
      allowNull: false,
      type: DataTypes.BLOB,
    },
  });

  dashboardAsset.associate = (models) => {
    dashboardAsset.belongsTo(models.Dashboard, {
      foreignKey: 'dashboard_id',
      targetKey: 'id',
      as: 'dashboard',
    });
  };

  return dashboardAsset;
};
