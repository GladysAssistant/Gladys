var translationsEN = {
  MESSAGE: {
    SEND_MESSAGE_FAILED: 'Failed to send message',
    TEXT_CANNOT_BE_EMPTY: 'Message text cannot be empty.'
  },
  MODULE: {
      CONFIG_FAIL_NOTIFICATION: 'Module configuration failed.',
      CONFIG_SUCCESS_NOTIFICATION: 'Module configured with success !',
      INSTALLED_SUCCESS_NOTIFICATION: 'Module installed with success : ',
      INSTALLED_FAIL_NOTIFICATION: 'Module failed to install : '
  },
  SYSTEM: {
      UPDATE_DATA_SUCCESS: 'Data updated with success',
      UPDATE_DATA_FAIL: 'Failed to updated data : '
  },
  USER: {
      UPDATED_SUCCESS: 'User updated with success : ',
      UPDATED_FAILURE: 'Failed to update user : '
  },
  EVENT: {
      CREATED_SUCCESS_NOTIFICATION: 'Event created with success : ',
      CREATED_FAIL_NOTIFICATION: 'Failed to create event : '
  },
  WEATHER: {
      day: 'Day',
      night: 'Night',
      HUMIDITY: 'Humidity',
      GET_GEOLOCATION_FAILED: 'Geolocation failed.'
  },
  CHAT: {
      TEXT_BOX_PLACEHOLDER: 'Write your message',
      TYPING: 'Typing'
  }   
};

var translationsFR = {
  MESSAGE: {
    SEND_MESSAGE_FAILED: 'Erreur lors de l\'envoi du message.',
    TEXT_CANNOT_BE_EMPTY: 'Un message ne peut pas être vide.'
  },
  MODULE: {
      CONFIG_FAIL_NOTIFICATION: 'Erreur lors de la configuration du module.',
      CONFIG_SUCCESS_NOTIFICATION: 'Le module a été configuré avec succès !',
      INSTALLED_SUCCESS_NOTIFICATION: 'Module installé avec succès : ',
      INSTALLED_FAIL_NOTIFICATION: 'Erreur lors de l\'installation du module : '
  },
  SYSTEM: {
      UPDATE_DATA_SUCCESS: 'Donnée Gladys mise à jour avec succès.',
      UPDATE_DATA_FAIL: 'Erreur lors de la mise à jour des données : '
  },
  USER: {
      UPDATED_SUCCESS: 'Utilisateur mis à jour avec succès : ',
      UPDATED_FAILURE: 'Erreur lors de la mise à jour d\'un utilisateur : '
  },
  EVENT: {
      CREATED_SUCCESS_NOTIFICATION: 'Event créé avec succès : ',
      CREATED_FAIL_NOTIFICATION: 'Erreur lors de la création de l\'event : '
  },
  WEATHER: {
      day: 'Jour',
      night: 'Nuit',
      HUMIDITY: 'Humidité',
      GET_GEOLOCATION_FAILED: 'Erreur lors de la géolocalisation :' 
  },
  CHAT: {
      TEXT_BOX_PLACEHOLDER: 'Tapez votre message',
      TYPING: 'En train d\'écrire'
  }    
};


    angular
       .module('gladys')
       .config(['$translateProvider', function ($translateProvider) {
            // add translation table
            $translateProvider
                .translations('en', translationsEN)
                .translations('fr', translationsFR);
        }]);