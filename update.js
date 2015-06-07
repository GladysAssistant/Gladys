
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');

var BACKUP_FOLDERNAME = ".GladysBackUp";

var filesToKeep = [
	'config/connections.js',
    'config/serialport.js',
    'config/machine.js',
    'config/googleapi.js'
];

backUpFiles();
syncWithGithub(function(err){
  if(err) return console.log(err);

  putfilesBack();
});

function cleanBackUpFolder(callback) {
    fs.readdir(BACKUP_FOLDERNAME, function(err, files){
       if(err) return callback(err);
        
       for(var i = 0;i<files.length;i++){
          fs.unlinkSync(path.join(BACKUP_FOLDERNAME, files[i]));
       }
       callback(null);
    });
}

function backUpFiles(){
  if (!fs.existsSync(BACKUP_FOLDERNAME)) {
    fs.mkdirSync(BACKUP_FOLDERNAME);
  }
  for(var i = 0; i< filesToKeep.length;i++){
    var pathDest = path.join(BACKUP_FOLDERNAME,path.basename(filesToKeep[i]));
    fs.createReadStream(filesToKeep[i]).pipe(fs.createWriteStream(pathDest));
  }  
}

function putfilesBack(){
    for(var i = 0; i< filesToKeep.length;i++){
    var pathOrigin = path.join(BACKUP_FOLDERNAME,path.basename(filesToKeep[i]));
    fs.createReadStream(pathOrigin).pipe(fs.createWriteStream(filesToKeep[i]));
  }  
}

function syncWithGithub(callback){
  exec('git pull https://github.com/GladysProject/Gladys.git master', function(error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) {
          console.log('exec error: ' + error);
      }
      callback(error);
  });
}





