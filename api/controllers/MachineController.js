
module.exports = {

    create: function(req, res, next){
        gladys.machine.create(req.body)
          .then((machine) => res.json(machine))
          .catch(next);
    },

    get: function(req, res, next){
        gladys.machine.get()
          .then((machines) => res.json(machines))
          .catch(next);
    },

    update: function(req, res, next){
        req.body.id = req.params.id;
        gladys.machine.update(req.body)
          .then((machine) => res.json(machine))
          .catch(next);
    },

    delete: function(req, res, next){
        gladys.machine.delete({id: req.params.id})
          .then(() => res.json({success: true}))
          .catch(next);
    }

};