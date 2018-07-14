
//config/machine.js
/*	If you want to install Gladys on several machine (On many Raspberry Pi for example), you'll have to 
determine who is the master, and who are the slaves. 
If the actual machine is a master, set master to 'true'
If the actual machine is a slave, set master to 'false'
IPStartWith : The beginning of all your IPs on your network (to detect if your are connecting on the same network)
*/

module.exports.machine = {
	foreignActionToken:'319cb7d86f65a848f0325f0827fa0fc55d6456c0',
	IPStartWith : '192.168'
};