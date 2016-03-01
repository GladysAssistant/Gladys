module.exports = install;

/**
 * Install a new Notification Type
 */
function install (type){
    return NotificationType.create(type);
}