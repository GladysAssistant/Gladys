
(function () {
    'use strict';

    angular
        .module('gladys')
        .controller('MessageCtrl', messageCtrl);

    messageCtrl.$inject = ['messageService', 'notificationService', '$timeout', '$scope'];

    function messageCtrl(messageService, notificationService, $timeout, $scope) {
        /* jshint validthis: true */
        var vm = this;
        vm.send = send;

        var typingMinTime = 300;
        var typingMaxTime = 600;

        vm.messages = [];
        vm.msg = []

        activate();

        function activate() {
            getMessages()
                .then(function() {
                    waitForNewMessage();
                });

            return ;
        }
        
        function getMessages() {
            return messageService.getByUser('null')
                .then(function(data) {
                    vm.messages = data.data;
                    for(var i = 0; i < vm.messages.length; i++){
                        if(vm.messages[i].sender == null){
                            vm.messages[i].type = ""
                            vm.messages[i].chat = "pull-left"
                            vm.messages[i].timeAgo = "pull-right"
                        }else{
                            vm.messages[i].type = "right"
                            vm.messages[i].chat = "pull-right"
                            vm.messages[i].timeAgo = "pull-left"
                        }
                    }
                    scrollToLastMessage();
                });
        }

        function scrollToLastMessage(){
             $timeout(function() {
                var chatBox = document.getElementById('chat-box');
                chatBox.scrollTop = chatBox.scrollHeight;
            }, 0, false);
        }

        function waitForNewMessage(){
            io.socket.on('message', function (message) {
                vm.typing = true;
                $scope.$apply();
                scrollToLastMessage();
                var randomWait = Math.floor(Math.random() * typingMaxTime) + typingMinTime;
                $timeout(function() {
                    vm.typing = false;
                    message.type = ""
                    message.chat = "pull-left"
                    message.timeAgo = "pull-right"
                    vm.messages.push(message);
                    scrollToLastMessage();
                }, randomWait, true);
            });
        }
        
        function send(text) {
            
            if(!text || text.length == 0) {
                return notificationService.errorNotificationTranslated('MESSAGE.TEXT_CANNOT_BE_EMPTY');
            }

            var message = {
                receiver: null,
                text: text
            };
            
            return messageService.send(message)
                .then(function(data) {
                    vm.msg = data.data
                    vm.msg.type = "right"
                    vm.msg.chat = "pull-right"
                    vm.msg.timeAgo = "pull-left"
                    vm.messages.push(vm.msg);
                    vm.newMessageText = '';
                    scrollToLastMessage();
                })
                .catch(function(err) {
                    notificationService.errorNotificationTranslated('MESSAGE.SEND_MESSAGE_FAILED', err);
                });
        }
    }
})();
