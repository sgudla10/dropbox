let jot=require('json-over-tcp')
let mkdirp=require('mkdirp')
let path=require('path')
let rimraf=require('rimraf')
let fs=require('pn/fs')
let request = require('request');
require('songbird')





let socket=jot.connect(8001);

const ROOT_DIR=path.resolve(process.cwd());

socket.on('connect',function(){
	console.log("client connected")
	 socket.write({question: "Hello, world?"});

})

socket.on('data',function(data){
	console.log("servers answer",data)
	console.log("servers answer",data.action)
	console.log("servers answer",data.path)
    if(data.action=='addDir'){
    	console.log("the file path to create is "+ROOT_DIR+data.path)
    	 //mkdirp(path.join(ROOT_DIR,data.path))
    	//console.log("created sucessfuly the direcory "+ROOT_DIR+path)
         createDir(data.path)
        }
    if(data.action=='unlinkDir')  {
    	 rimraf(path.join(ROOT_DIR,data.path),function(err){
        	if(err){
        		console.log(err);
        	}
        })

    }
    if(data.action=='unlink'){
    	   deleteFile(data.path)
    
    }  
    if(data.action=='add'||data.action=='change'){
    	request({
    		url: "http://127.0.0.1:8001"/+data.path, //URL to hit
    		method: 'GET',
    		
	}, function(error, response, body){
    	if(error) {
        	console.log(error);
   		 } else {
        	console.log(response.statusCode, body);

        	let destination = fs.createWriteStream(path.join(ROOT_DIR,data.path));
            console.log("file path: " + data.path)
            fs.promise.truncate(path.join(ROOT_DIR,data.path),0)
            request(url).pipe(destination)



        	
    	}
		});
    }




    

})



 async function createDir(filepath){
	   try { 
	    console.log("createDir is being called "+filepath)
		await mkdirp.promise(path.join(ROOT_DIR,filepath))
		console.log("created the directory of path "+path.join(ROOT_DIR,filepath))
	  }
	  catch(e){
	  	console.log(e.stack)
	  }

}

async function deleteFile(filepath){
	
		await fs.unlink(path.join(ROOT_DIR,filePath))
	


}






