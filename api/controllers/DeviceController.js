/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
module.exports = {
  
  
  /**
   * Return all devices (with pagination)
   * @take: number of device to return
   * @skip: for pagination
   */
  index: function(req, res, next) {
      gladys.device.get(req.query)
            .then(function(devices){
                return res.json(devices);
            })
            .catch(next);
  },
  
  /**
   * Return all deviceTypes for a specific device
   */
  getDeviceTypes: function(req, res, next){
    gladys.deviceType.getByDevice({id: req.params.id})
      .then(function(deviceTypes){
          return res.json(deviceTypes);
      }) 
      .catch(next);
  },
  
  /**
   * Return all devices for a specific service
   */
  getDeviceByService: function(req, res, next){
    gladys.device.getByService({service: req.params.service})
      .then(function(devices){
          return res.json(devices);
      }) 
      .catch(next);
  },
  
  /**
   * Create a new device
   */
  create: function(req, res, next) {
      gladys.device.create(req.body)
            .then(function(device){
                return res.status(201).json(device);
            })
            .catch(next);
  },
  
  /**
   * Update a device
   */
  update: function(req, res, next) {
      req.body.id = req.params.id;
      gladys.device.update(req.body)
            .then(function(device){
                return res.json(device);
            })
            .catch(next);
  },
  
  /**
   * Delete a device
   */
  delete: function(req, res, next) {
      gladys.device.delete({id: req.params.id})
            .then(function(device){
                return res.json(device);
            })
            .catch(next);
  }
    
};
