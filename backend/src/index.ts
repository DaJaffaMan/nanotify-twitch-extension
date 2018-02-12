import Rai from 'raiblocks-js';
import * as fs from 'fs';
import * as https from 'https';
import * as WS from 'ws';

const options = {
	key: fs.readFileSync('/boilerplate/certs/testing.key'),
	cert: fs.readFileSync('/boilerplate/certs/testing.crt')
};

const rai = new Rai('http://ec2-18-196-194-4.eu-central-1.compute.amazonaws.com:7076');

const express = require('express');
const app = express();
const server = https.createServer(options, app);

function setRoutes() {
	app.use((req: any, res: any, next: any) => {
		console.log('Got request', req.path, req.method);
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
		res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
		res.setHeader('Access-Control-Allow-Origin', '*');
		return next();
	});

	app.use(express.static('../frontend'));
}

function startWS() {
	const wss = new WS.Server({server});
	wss.on('connection', function connection(ws: any) {
		ws.on('message', function message(msg: any) {
			console.log(msg);
		});
	});

	const ws = new WS(`wss://localhost:${server.address().port}`, {
		rejectUnauthorized: false
	});


	ws.on('open', function open() {
		rai.blocks.count().then((res: any) => {
			console.log(res)
		});
	});
}

function startServer() {
	server.listen(8080, function () {
		console.log('Extension Boilerplate service running on https');

		setRoutes();
		startWS();
	});
}

startServer();