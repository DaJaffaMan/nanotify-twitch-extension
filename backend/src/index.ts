const {default: Rai} = require('raiblocks-js');
const express = require('express');
const fs = require('fs');
const https = require('https');
const WS = require('ws');

const options = {
	key: fs.readFileSync('/boilerplate/certs/testing.key'),
	cert: fs.readFileSync('/boilerplate/certs/testing.crt')
};

const PORT = 9001;

const app = express();
const server = https.createServer(options, app);
const wss = new WS.Server({server});
wss.on('connection', function connection(ws: any) {
	ws.on('message', function message(msg: any) {
		console.log(msg);
	});
});

const rai = new Rai('http://ec2-18-196-194-4.eu-central-1.compute.amazonaws.com:7076');

app.use((req:any, res:any, next:any) => {
	console.log('Got request', req.path, req.method);
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
	res.setHeader('Access-Control-Allow-Origin', '*');
	return next();
});

app.use(express.static('../frontend'));

server.listen(PORT, function () {
	console.log('Extension Boilerplate service running on https', PORT);

	const ws = new WS(`wss://localhost:${server.address().port}`, {
		rejectUnauthorized: false
	});


	ws.on('open', function open() {
		rai.blocks.count().then((res: any)=> {
			console.log(res)
		});
	});
});
