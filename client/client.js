let jot=require('json-over-tcp')

let socket=jot.connect(8001);
socket.on('connect',function(){
	console.log("client connected")
	 socket.write({question: "Hello, world?"});

})

socket.on('data',function(data){
	console.log("servers answer",data.answer)
     	console.log("servers answer",data)

})



