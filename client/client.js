let jot=require('json-over-tcp')
let mkdirp=require('mkdirp')
let path=require('path')
let rimraf=require('rimraf')
let fs=require('pn/fs')
let request = require('request');




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
    	   fs.unlink(path.join(ROOT_DIR,data.path))
    
    }  
    if(data.action=='add'){
    	request({
    		url: 'https://modulus.io/contact/demo', //URL to hit
    		qs: {from: 'blog example', time: +new Date()}, //Query string data
    		method: 'POST',
    		headers: {
        		'Content-Type': 'MyContentType',
        		'Custom-Header': 'Custom Value'
    	},
    	body: 'Hello Hello! String body!' //Set the body as a string
	}, function(error, response, body){
    	if(error) {
        	console.log(error);
   		 } else {
        	console.log(response.statusCode, body);
    	}
		});
    }




    

})



 async function createDir(path){
	    console.log("createDir is being called "+path)
		await mkdirp.promise(path.join(ROOT_DIR,path))
		console.log("created the directory of path "+path.join(ROOT_DIR,path))
	  

}

function createFile(path){

}






