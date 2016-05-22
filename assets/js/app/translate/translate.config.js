var translationsEN = {
  MODULE: {
      CONFIG_FAIL_NOTIFICATION: 'Module configuration failed.',
      CONFIG_SUCCESS_NOTIFICATION: 'Module configured with success !',
      INSTALLED_SUCCESS_NOTIFICATION: 'Module installed with success : ',
      INSTALLED_FAIL_NOTIFICATION: 'Module failed to install : '
  }  
};

var translationsFR = {
  MODULE: {
      CONFIG_FAIL_NOTIFICATION: 'Erreur lors de la configuration du module.',
      CONFIG_SUCCESS_NOTIFICATION: 'Le module a été configuré avec succès !',
      INSTALLED_SUCCESS_NOTIFICATION: 'Module installé avec succès : ',
      INSTALLED_FAIL_NOTIFICATION: 'Erreur lors de l\'installation du module : '
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