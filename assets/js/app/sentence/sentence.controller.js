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

  SentenceCtrl.$inject = ['sentenceService', '$scope', 'notificationService'];

  function SentenceCtrl(sentenceService, $scope, notificationService) {
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
    // helpers
    vm.eq = (a, b) => a === b;
    vm.neq = (a, b) => a != b;

    activate();

    function activate() {
        return getLabels()
        .then(loadMore());
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
            return get(vm.startValue+vm.nbElementToGet, vm.startValue)
            .then(() => vm.startValue += vm.nbElementToGet)
        }
        else {
            Promise.resolve()
        }
    }
    function get(take, skip) {
        vm.remoteIsBusy = true;
        return sentenceService.get(take, skip)
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