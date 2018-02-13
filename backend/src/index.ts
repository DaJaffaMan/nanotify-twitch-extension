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

let blockQueue: Block[] = [];

interface Block {
	hash: string,
	amount: number,
	source: string
}

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
	const ws = new WebSocket(`wss://localhost:${server.address().port}`, {
		rejectUnauthorized: false
	});

	console.log(new Date());
	const pendingTransactions = await rai.pending.get({
		account: 'xrb_3gyoidb4mqb1qf6k8d7caddqfecnkcpe81cppizupwqxbz8fyu3eubp4rhqu',
		count: 10000,
		threshold: 0,
		source: true
	});
	console.log(pendingTransactions)

	Object.keys(pendingTransactions.blocks).forEach(hash => {

		blockQueue.forEach(blockInQueue => {
			if (blockInQueue.hash !== hash) {
				const block: Block = {
					hash: hash,
					amount: pendingTransactions.blocks[hash].amount,
					source: pendingTransactions.blocks[hash].source
				};

				blockQueue.push(block)
			}
		})
	});

	ws.on('open', () => {
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