import Rai from 'raiblocks-js';
import * as fs from 'fs';
import * as https from 'https';
import * as WebSocket from 'ws';

const options = {
	key: fs.readFileSync('/boilerplate/certs/testing.key'),
	cert: fs.readFileSync('/boilerplate/certs/testing.crt')
};

const rai = new Rai('http://ec2-18-196-194-4.eu-central-1.compute.amazonaws.com:7076');

const express = require('express');
const app = express();
const server = https.createServer(options, app);
const wss = new WebSocket.Server({server});

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

async function startWS() {
	wss.on('connection', function connection(ws: any) {
		ws.on('message', function message(msg: any) {
			console.log(msg)
		});
	});

	setInterval(requestPending, 5000);
}

async function requestPending() {
	console.log(new Date());
	const pendingTransactions = await rai.pending.get({account: '',count: 10000, threshold: 0, source: true});
	console.log(pendingTransactions)
	const blockCount = await rai.blocks.count();
	const ws = new WebSocket(`wss://localhost:${server.address().port}`, {
		rejectUnauthorized: false
	});

	ws.on('open', () => {
		ws.send(blockCount.count);
		// ws.send(pendingTransactions.blocks);
	})
}

function startServer() {
	server.listen(8080, function () {
		console.log('Extension Boilerplate service running on https');

		setRoutes();
		startWS();
	});
}

startServer();