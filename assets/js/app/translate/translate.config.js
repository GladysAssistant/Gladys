var translationsEN = {
    HOUSE: {
        INVALID_ADDRESS: 'Address field is invalid. Should not be empty !',
        INVALID_CITY: 'City field is invalid. Should not be empty !',
        INVALID_COUNTRY: 'Country field is invalid. Should not be empty !',
        INVALID_LATITUDE: 'Latitude field is invalid. Should be formatted like "49.78787".',
        INVALID_LONGITUDE: 'Latitude field is invalid. Should be formatted like "2.12787".',
        INVALID_NAME: 'Name field is invalid. Should not be empty !',
        INVALID_POSTCODE: 'Postcode field is invalid. Should not be empty !',
    },
    ROOM: {
        INVALID_NAME: 'Address field is invalid. Should not be empty !',
        INVALID_HOUSE: 'House field is invalid. You must select a house !',
    },
    DEVICE: {
        INVALID_NAME: 'Name field is invalid. Should not be empty !',
        INVALID_PROTOCOL: 'Protocol field is invalid. Should not be empty !',
        INVALID_SERVICE: 'Service field is invalid. Should not be empty !',
    },
    DEVICETYPE: {
        INVALID_MAX: 'Max field is invalid. Should not be empty and should be an integer !',
        INVALID_MIN: 'Min field is invalid. Should not be empty and should be an integer !',
        INVALID_TYPE: 'Type field is invalid. Should not be empty. Type can be "binary", "multilevel", "color", "luminosity", ...',
    },
    PARAM: {
        INVALID_NAME: 'Key field is invalid. Should not be empty !',
        INVALID_VALUE: 'Value field is invalid. Should not be empty !',
    },
    AREA: {
        INVALID_NAME: 'Name field is invalid. Should not be empty !',
        INVALID_LATITUDE: 'Latitude field is invalid. Should be formatted like "49.78787".',
        INVALID_LONGITUDE: 'Latitude field is invalid. Should be formatted like "2.12787".',
        INVALID_RADIUS: 'Radius field is invalid. Should be a value in meters like "30.4".',
    },
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
    },
    VALIDATION: {
        ERROR: 'Some fields are invalid !'
    },
    DEFAULT: {
        ERROR: 'Something bad happened :/ Check Gladys logs for more informations.'
    }
};

var translationsFR = {
    HOUSE: {
        INVALID_ADDRESS: 'Le champ "Adresse" est invalide ! Il ne doit pas être vide.',
        INVALID_CITY: 'Le champ "Ville" est invalide ! Il ne doit pas être vide.',
        INVALID_COUNTRY: 'Le champ "Pays" est invalide ! Il ne doit pas être vide.',
        INVALID_LATITUDE: 'Le champ "Latitude" est invalide. Il doit être formatté de cette façon : "49.78787".',
        INVALID_LONGITUDE: 'Le champ "Longitude" est invalide. Il doit être formatté de cette façon : "2.12787".',
        INVALID_NAME: 'Le champ "Nom" est invalide ! Il ne doit pas être vide.',
        INVALID_POSTCODE: 'Le champ "Code postal" est invalide ! Il ne doit pas être vide.',
    },
    ROOM: {
        INVALID_NAME: 'Le champ "Nom" est invalide ! Il ne doit pas être vide.',
        INVALID_HOUSE: 'Le champ "Maison" est invalide ! Vous devez sélectionner une maison.',
    },
    DEVICE: {
        INVALID_NAME: 'Le champ "Nom" est invalide ! Il ne doit pas être vide.',
        INVALID_PROTOCOL: 'Le champ "Protocole" est invalide ! Il ne doit pas être vide.',
        INVALID_SERVICE: 'Le champ "Service" est invalide ! Il ne doit pas être vide.',
    },
    DEVICETYPE: {
        INVALID_MAX: 'Le champ "Max" est invalide ! Il ne doit pas être vide et doit être un nombre entier.',
        INVALID_MIN: 'Le champ "Min" est invalide ! Il ne doit pas être vide et doit être un nombre entier.',
        INVALID_TYPE: 'Le champ "Type" est invalide. Il ne doit pas être vide. Type peut être "binary", "multilevel", "color", "luminosity", ...',
    },
    PARAM: {
        INVALID_NAME: 'Le champ "Clé" est invalide ! Il ne doit pas être vide.',
        INVALID_VALUE: 'Le champ "Valeur" est invalide ! Il ne doit pas être vide.',
    },
    AREA: {
        INVALID_NAME: 'Le champ "Nom" est invalide ! Il ne doit pas être vide.',
        INVALID_LATITUDE: 'Le champ "Latitude" est invalide. Il doit être formatté de cette façon : "49.78787".',
        INVALID_LONGITUDE: 'Le champ "Longitude" est invalide. Il doit être formatté de cette façon : "2.12787".',
        INVALID_RADIUS: 'Le champ "Rayon" est invalide. Il doit être formatté de cette façon : "30.4".',  
    },
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
    },
    VALIDATION: {
        ERROR: 'Certains champs sont invalides !'
    },
    DEFAULT: {
        ERROR: 'Une erreur inconnue est arrivée :/ Regardez les logs Gladys pour plus d\'informations.'
    }
};


angular
    .module('gladys')
    .config(['$translateProvider', function($translateProvider) {
        // add translation table
        $translateProvider
            .translations('en', translationsEN)
            .translations('fr', translationsFR);
    }]);