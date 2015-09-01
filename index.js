let express=require('express')
let morgan =require('morgan')
let fs=require('pn/fs')
let nodeify=require('bluebird-nodeify')
let path=require('path')
let mime=require('mime-types')
let rimraf=require('rimraf')
let mkdirp=require('mkdirp')
let bluebird=require('bluebird')
require('songbird')
let jot=require('json-over-tcp')

let chokidar = require('chokidar');
let socketGlobal = [];

bluebird.longStackTraces()

let watcher = chokidar.watch('file, dir, or glob', {
  ignored: /[\/\\]\./, persistent: true
});

var log = console.log.bind(console);
chokidar.watch('.', {ignored: /[\/\\]\./}).on('all', (event, path) => 
{
    console.log(event, path)
    if (socketGlobal[0]){
        let response = JSON.parse('{}')
        let action =''
        if(event=='add'){
        	console.log("Added a new file with file path "+path)
        	action='add'
        }
        else if(event=='addDir'){
        	console.log("Added a new dir with file path "+path)
        	action='addDir'

        }
        else if(event=='change'){
        	console.log("changed a new dir with file path "+path)
           action='change'

        } 
        else if(event=='unlinkDir'){
        	console.log("changed a removed dir with file path "+path)
        	 action='unlinkDir'

        }
        else if(event=='unlink'){
        	console.log("changed a removed file with file path "+path)
        	 action='unlink'


        }
        response.action=action
        response.path=path


        socketGlobal[0].write({
                      // time of creation/deletion/update

       "action" :action,"path":path
                  }
)

   }
})





const NODE_ENV=process.env.NODE_ENV||'development'
const PORT=process.env.PORT ||8000
const ROOT_DIR=path.resolve(process.cwd());

//fs.watch(ROOT_DIR,function(event,filename){
	//console.log("watching got triggered ");
	//console.log('event', event,'filename',filename);
	//if(socket){
		//socket.write(event);
	//}
//});

var server = jot.createServer(8001);

server.on('listening', ()=>{
	console.log("Listening on 127.0.0.1:"+8001)
});

server.on('connection', newConnectionHandler);


// Triggered whenever something connects to the server 
function newConnectionHandler(socket){
	socketGlobal[0]=socket
  // Whenever a connection sends us an object... 
  socket.on('data', function(data){
    // Output the question property of the client's message to the console 
    console.log("Client's question: " + data.question);
 	});
  socket.write({answer: 42});

};


 
// Start listening 
server.listen(8001,()=>{
	console.log("TCP server is listening at port "+8001)
});

let app=express()
console.log("ENV is "+NODE_ENV)
console.log("port is "+PORT)
console.log("CWD is "+ROOT_DIR)
if(NODE_ENV==='development'){
	console.log("inside the block of dev")
	app.use(morgan('dev'))
}
app.listen(PORT,() =>{
	console.log("Listening the port 127.0.0.1:"+PORT)
})
app.get('*',setFilePath,sendHeaders,(req,res)=> {
	if(res.body){
		res.json(res.body)
		return
	}
  fs.createReadStream(req.filePath).pipe(res)

	

})




  
  


app.head('*',setFilePath,sendHeaders,(req,res)=>{
	res.end()
})


app.put('*',setFilePath,setDirDetail,(req,res,next)=>{
  //console.log("put is called with file path "+req.filePath)
  async()=>{
  	  //console.log("put is called with file path "+req.filePath)

  	await mkdirp.promise(req.dirPath)
  	if(!req.isDir){
  		req.pipe(fs.createWriteStream(req.filePath))
  	    res.end()
  	}
  }().catch(next)



})



app.post('*',setFilePath,setDirDetailPost,(req,res,next)=>{
  
async()=>{
	if(req.isDir){//if it is a directory send a error 
		res.status(400).send("Bad request")
	}
	req.pipe(fs.createWriteStream(req.filePath))
  	    res.end()
  	
  }().catch(next)





})








app.delete('*',setFilePath,sendHeaders,(req,res,next)=>{
  async()=>{
   console.log("delete called")
  	let fstat=await fs.stat(req.filePath);
   if(!fstat){
   	return res.send('400',"Invaid path")
   }

   if(fstat.isDirectory()){
   	console.log("rimraf"+rimraf)
       //await rimraf.promise(req.filePath)
        rimraf(req.filePath,function(err){
        	if(err){
        		console.log(err);
        	}
        	res.end()
        })

      }
   else {
       await fs.unlink(req.filePath)
      }
        res.end()

    }().catch(next)
})


async function setFileMeta(req, res, next) {
	log.console("setFileMeta")
    req.filePath = path.resolve(path.join(ROOT_DIR, req.url))
    if (req.filePath.indexOf(ROOT_DIR) !== 0) {
        res.send(400, 'Invalid path')
        return
    }
    let fsstat=await fs.stat(req.filePath);
    fsstat.then(stat => req.stat = stat, ()=> req.stat = null).nodeify(next)
    console.log("req.filePath "+req.filePath+" req.stat "+res.stat)
}

function setDirDetail(req,res,next){
	console.log("setdirDetail is called with filepath "+req.filePath)
	async()=>{
	let fstat;
	try {
	 fstat=await fs.stat(req.filePath);
	}
	catch(e){
		console.log("i am here")
	}
	console.log("printing the filestat"+fstat);
	if(fstat){//if the file exists then send a error response
		console.log("before sending the response")
		res.status(405).send("path exists")
	    return
	}

	let endswithslash=req.filePath.charAt(req.filePath.length-1)===path.sep
	let hasExt=path.extname(req.filePath)!==''
	console.log("endswithslash"+endswithslash)
	console.log("hasExt"+hasExt)
	req.isDir=endswithslash || !hasExt
	req.dirPath=req.isDir?req.filePath:path.dirname(req.filePath)
	console.log("req.isDir"+req.isDir)
	console.log("req.dirPath"+req.dirPath)
	next()

}().catch(next)
}

function setDirDetailPost(req,res,next){
	console.log("setdirDetail is called with filepath "+req.filePath)
	async()=>{
	let fstat;
	try {
	 fstat=await fs.stat(req.filePath);
	}
	catch(e){
		console.log("i am here")
	}
	console.log("printing the filestat"+fstat);
	let endswithslash=req.filePath.charAt(req.filePath.length-1)===path.sep
	let hasExt=path.extname(req.filePath)!==''
	console.log("endswithslash"+endswithslash)
	console.log("hasExt"+hasExt)
	req.isDir=endswithslash || !hasExt
	req.dirPath=req.isDir?req.filePath:path.dirname(req.filePath)
	console.log("req.isDir"+req.isDir)
	console.log("req.dirPath"+req.dirPath)
	next()

}().catch(next)
}



function setFilePath(req,res,next){
	console.log("filepath is called")
	let filePath=path.resolve(path.join(ROOT_DIR,req.url))
	req.filePath=filePath
	if(filePath.indexOf(ROOT_DIR)!==0){
	 res.send(400,"Invalid request");
	 return 
	}

	next()
}

function sendHeaders(req,res,next){
	nodeify(async() =>{
	console.log("setheader is called");
	let filePath=req.filePath;
	console.log("filePath"+filePath)
	let fstat=await fs.stat(filePath);
	if(fstat.isDirectory()){
		console.log("It is a directory");
		let files=await fs.readdir(filePath);
		res.body=JSON.stringify(files.length);
		res.setHeader('Content-Length',res.body.length)
		res.setHeader('Content-Type','application/json')
		return
	}   
	res.setHeader('Content-Length',fstat.size)
	let  contenttype=mime.contentType(path.extname(filePath))
	res.setHeader('Content-Type',contenttype)

  }(),next)
	
}