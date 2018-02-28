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
    .controller('SentenceCtrl', SentenceCtrl);

  SentenceCtrl.$inject = ['sentenceService', '$scope', 'notificationService', 'brainService'];

  function SentenceCtrl(sentenceService, $scope, notificationService, brainService) {
    /* jshint validthis: true */
    var vm = this;
    vm.sentences = [];
    vm.labels = [];
    vm.change = change;
    vm.reject = reject;
    vm.approve = approve;
    vm.loadMore = loadMore;
    vm.get = get;
    vm.remoteIsBusy = false;
    vm.noMoreSentences = false;
    vm.startValue = 0;
    vm.nbElementToGet = 50;
    vm.setStatus = setStatus;
    vm.status = 'pending';
    vm.trainNew = trainNew;
    vm.training = false;

    activate();

    function activate() {
        return getLabels()
        .then(loadMore());
    }

    function trainNew() {
        vm.training = true;
         brainService.trainNew()
         .then(function() {
             vm.training = false
             notificationService.successNotificationTranslated('BRAIN.TRAINNED_SUCCESS_NOTIFICATION');
        })
        .catch(function () {
             vm.training = false
             notificationService.errorNotificationTranslated('BRAIN.TRAINNED_FAIL_NOTIFICATION');
        });
    }
     
    function setStatus( status ) {
        if(status === vm.status) return Promise.resolve();
        vm.status = status;
        vm.startValue = 0;
        vm.sentences = [];
        vm.noMoreSentences = false;
        loadMore();
        return;
    }

    function change(sentence) {
        var parts = sentence.serviceLabelConcat.split('.');
        var updatedSentence = {
            id: sentence.id,
            status: 'approved',
            service: parts[0],
            label: parts[1]
        };
        return sentenceService.update(updatedSentence)
            .then(function() {
                notificationService.successNotificationTranslated('BRAIN.SENTENCE_UPDATED_SUCCESS_NOTIFICATION');
            })
            .catch(function () {
                notificationService.errorNotificationTranslated('BRAIN.SENTENCE_UPDATED_FAIL_NOTIFICATION');
            });
    }

    function reject(id, index) {
        return sentenceService.reject(id)
            .then(function(data){
                vm.sentences.splice(index, 1);
            });
    }
    function approve(id, index) {
        return sentenceService.approve(id)
            .then(function(data){
                vm.sentences.splice(index, 1);
            });
    }
    function getLabels() {
        return sentenceService.getLabels()
            .then(function(data){
                data.data.forEach(function(elem, index){
                    elem.serviceLabelConcat = elem.service + '.' + elem.label;
                });
                vm.labels = data.data;
            });    
    }
    function loadMore(){
        if(!vm.remoteIsBusy && !vm.noMoreSentences){
            get(vm.status, vm.nbElementToGet, vm.startValue);
            vm.startValue += vm.nbElementToGet;
        }
    }
    function get(status, take, skip) {
        vm.remoteIsBusy = true;
        return sentenceService.get({status: status}, take, skip)
            .then(function(data){
                if(data.data.length === 0){
                    vm.noMoreSentences = true;
                }
                data.data.forEach(function(elem, index){
                    elem.serviceLabelConcat = elem.service + '.' + elem.label;
                });
                vm.sentences = vm.sentences.concat(data.data);
                vm.remoteIsBusy = false;
            });
    }
  }
})();