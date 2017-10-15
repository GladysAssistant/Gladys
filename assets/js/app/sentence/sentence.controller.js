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
    // helpers
    vm.eq = (a, b) => a === b;
    vm.neq = (a, b) => a != b;
    vm.oneOf = (value, array) => ~array.indexOf(value);

    activate();

    function activate() {
        return getLabels()
        .then(loadMore());
    }

    function trainNew() {
        vm.training = true;
         brainService.trainNew()
         .then(() => {
             vm.training = false
             notificationService.successNotificationTranslated('BRAIN.TRAINNED_SUCCESS_NOTIFICATION');
        })
        .catch(() => {
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
        return loadMore();
    }

    function change(sentence) {
        sentence.status = "approved";
        return sentenceService.update(sentence)
    }
    function reject(id) {
        return sentenceService.reject(id)
        .then( ({ data }) => vm.sentences[vm.sentences.findIndex(sentence => sentence.id === data.id)] = data)
    }
    function approve(id) {
        return sentenceService.approve(id)
        .then( ({ data }) => vm.sentences[vm.sentences.findIndex(sentence => sentence.id === data.id)] = data)
    }
    function getLabels() {
        return sentenceService.getLabels().then(data => vm.labels = data.data);    
    }
    function loadMore(){
        if(!vm.remoteIsBusy && !vm.noMoreSentences){
            return get(vm.status, vm.startValue+vm.nbElementToGet, vm.startValue)
            .then(() => vm.startValue += vm.nbElementToGet)
        }
        else {
            Promise.resolve()
        }
    }
    function get(status, take, skip) {
        vm.remoteIsBusy = true;
        return sentenceService.get({status}, take, skip)
            .then(function(data){
                if(data.data.length === 0){
                    vm.noMoreSentences = true;
                }
                vm.sentences = vm.sentences.concat(data.data);
                vm.remoteIsBusy = false;
            });
    }
  }
})();