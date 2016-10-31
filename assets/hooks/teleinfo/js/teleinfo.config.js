var translationsEN = {
  TELEINFO_PLUS: 'Data vue',
  TELEINFO_WATT_LINE_TITLE: 'Watt per hour',
  TELEINFO_KWH_BAR_TITLE: 'KwH per day',
  CONTRACT_NUMBER: 'Contract n° ',
  TOMORROW: 'Tomorrow'
};
var translationsFR = {
  TELEINFO_PLUS: 'Données Téléinfo',
  TELEINFO_WATT_LINE_TITLE: 'Watt par heure',
  TELEINFO_KWH_BAR_TITLE: 'KwH par jour',
  CONTRACT_NUMBER: 'Contrat n° ',
  TOMORROW: 'Demain'
};

angular
.module('gladys')
.config(['$translateProvider', function ($translateProvider) {
  // add translation table
  $translateProvider.translations('en', translationsFR);
  $translateProvider.translations('en', translationsEN);
}]);

