const NOTIFICATION_TEXT_PATTERNS = [
  '%résumé hebdomadaire%',
  '%weekly home summary%',
  '%wöchentliche%zusammenfassung%',
  '%Gladys a été mise à jour%',
  '%Gladys has been upgraded%',
  '%community.gladysassistant.com%',
  '%sauvegarde Gladys Plus a échoué%',
  '%Gladys Plus backup failed%',
  '%Avertissement ! Le niveau de la batterie%',
  '%Warning ! Battery level%',
];

/**
 * @description Build SQL LIKE conditions for proactive notification messages.
 * @returns {string} SQL OR clause.
 * @example
 * buildNotificationTextSqlConditions();
 */
function buildNotificationTextSqlConditions() {
  return NOTIFICATION_TEXT_PATTERNS.map((pattern) => `text LIKE '${pattern.replace(/'/g, "''")}'`).join(' OR ');
}

module.exports = {
  up: async (queryInterface) => {
    const textConditions = buildNotificationTextSqlConditions();

    await queryInterface.sequelize.query(`
      UPDATE t_message
      SET message_type = 'notification', updated_at = CURRENT_TIMESTAMP
      WHERE message_type = 'chat'
        AND sender_id IS NULL
        AND receiver_id IS NOT NULL
        AND (${textConditions})
    `);
  },

  down: async () => {},
};
