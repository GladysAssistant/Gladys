module.exports = (sequelize, DataTypes) => {
  const tagScene = sequelize.define(
    't_tag_scene',
    {
      scene_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.STRING,
      },
    },
    {},
  );

  tagScene.associate = (models) => {
    tagScene.belongsTo(models.Scene, {
      foreignKey: 'scene_id',
      targetKey: 'id',
      as: 'scene',
    });
  };

  return tagScene;
};
