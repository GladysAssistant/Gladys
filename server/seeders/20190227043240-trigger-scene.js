module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_trigger_scene',
      [
        {
          id: '55842521-85be-4fd2-b34d-1c34c4661df7',
          trigger_id: '1763b345-b2b6-4c9b-8fed-ae017109956c',
          scene_id: '3a30636c-b3f0-4251-a347-90787f0fe940',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: (queryInterface, Sequelize) => queryInterface.bulkDelete('t_trigger_scene', null, {}),
};
