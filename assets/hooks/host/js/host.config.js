var translationsEN = {
  EDIT_HOST: 'Edit host',
  NEW_HOST: 'New host',
  SAVE_HOST: 'Save host',
  HOST_NAME: 'Label',
  HOSTNAME_OR_IP: 'Hostname or @IP',
};
var translationsFR = {
  EDIT_HOST: 'Editer une machine',
  NEW_HOST: 'Nouvelle machine',
  SAVE_HOST: 'Sauvegarder la machine',
  HOST_NAME: 'Label',
  HOSTNAME_OR_IP: 'Hostname ou @IP',
};

angular
.module('gladys')
.config(['$translateProvider', function ($translateProvider) {
  // add translation table
  $translateProvider.translations('en', translationsFR);
  $translateProvider.translations('en', translationsEN);
}]);
