module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_tag_scene',
      [
        {
          scene_id: '956794d8-a9cb-49bf-a677-57e820288b5a',
          name: 'tag 1',
          created_at: '2023-10-12 07:49:07.556 +00:00',
          updated_at: '2023-10-12 07:49:07.556 +00:00',
        },
        {
          scene_id: '956794d8-a9cb-49bf-a677-57e820288b5a',
          name: 'tag 2',
          created_at: '2023-10-12 07:49:07.556 +00:00',
          updated_at: '2023-10-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: async (queryInterface, Sequelize) => queryInterface.bulkDelete('t_tag_scene', null, {}),
};
