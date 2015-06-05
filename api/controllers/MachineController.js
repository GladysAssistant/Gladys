/**
 * MachineController
 *
 * @description :: Server-side logic for managing Machines
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
	
	index:function(req, res, next){
		var request = "SELECT machine.id, machine.name, house.name AS house, machine.ip, machine.master, machine.me FROM machine ";
		request+= "JOIN house ON (machine.house = house.id) ";
		request+= "WHERE machine.house IN ( SELECT house FROM userhouserelation WHERE userhouserelationtype = 1 ";
		request+= "AND user = ? )";
		Machine.query(request, [req.session.User.id], function(err, machines){
			if(err) return res.json(err);

			res.json(machines);
		});		
	},
	
	create: function(req,res,next){
		var machineObj = {
			name:req.param('name'),
			house:req.param('house'),
			ip:req.param('ip'),
			master:req.param('master'),
			me:req.param('me')
		};
		
		Machine.create(machineObj)
			.exec(function(err, machine){
				if(err) return res.json(err);
				
				return res.json(machine);
			});
	},
	
	destroy:function(req,res,next){
		Machine.destroy(req.param('id'))
			.exec(function(err, machine){
				if(err) return res.json(err);
				
				return res.json(machine);
			});	
	}
	
};

