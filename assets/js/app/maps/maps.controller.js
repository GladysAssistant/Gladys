/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
(function () {
    'use strict';

    angular
        .module('gladys')
        .controller('MapsCtrl', MapsCtrl);

    MapsCtrl.$inject = ['geoLocationService'];

    function MapsCtrl(geoLocationService) {
        /* jshint validthis: true */
        var vm = this;
        
        var leafletMap;
        var markerUser = {};
    
        getPoints();

        function getPoints(){
            geoLocationService.get()
                .then(function(data) {
                    vm.locations = data.data;
                    if(vm.locations.length) {
                        initMap(vm.locations[0].latitude, vm.locations[0].longitude, 10);
                    } else {

                        // eiffel tower !
                        initMap(48.858093, 2.294694, 8);
                    }
                    
                    vm.locations.forEach(function(location){
                        markerUser[location.user] = L.marker([location.latitude, location.longitude]).addTo(leafletMap);
                        markerUser[location.user].bindTooltip(location.firstname + ' ' + location.lastname).openTooltip();
                    });

                    waitForNewValue();
                });
        }

        function initMap(latitude, longitude, zoomLevel){
            leafletMap = L.map('map').setView([latitude, longitude], zoomLevel);

            var CartoDB_Positron = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(leafletMap);
        }

        function waitForNewValue(){
        
            io.socket.on('newLocation', function (location) {
                updateValue(location);
            });
        }

        function updateValue(location) {
            markerUser[location.user].setLatLng(L.latLng(location.latitude, location.longitude));
        }

    }
})();
