##Notification

Notification object let you manipulate notifications.

###Install

**Params**

Need a NotificationType object in parameter.

**Example**

```javascript
var notificationType = {
    service: 'PushBulletService'  
};

gladys.notification.install(notificationType)
      .then(function(type){
          // new type created !
      })
      .catch(function(err){
         // something bad happened :/ 
      });
```
