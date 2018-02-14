import Rai from 'raiblocks-js';
import * as fs from 'fs';
import * as https from 'https';
import * as WebSocket from 'ws';

const MAX_PENDING_TRANSACTIONS = 100;

const options = {
    key: fs.readFileSync('/boilerplate/certs/testing.key'),
    cert: fs.readFileSync('/boilerplate/certs/testing.crt')
};

const rai = new Rai('http://ec2-18-196-194-4.eu-central-1.compute.amazonaws.com:7076');

const express = require('express');
const app = express();
const server = https.createServer(options, app);
const wss = new WebSocket.Server({server});

wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

wss.on('connection', async function connection() {
    requestPending();
});

let isIntervalSet = false;

let broadcastableBlocks: Map<string, number> = new Map<string, number>();
let broadcastedBlocks: Map<string, number> = new Map<string, number>();


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

async function requestPending() {
    console.log(new Date())

    const pendingTransactions = await rai.pending.get({
        account: 'xrb_3gyoidb4mqb1qf6k8d7caddqfecnkcpe81cppizupwqxbz8fyu3eubp4rhqu',
        count: MAX_PENDING_TRANSACTIONS,
        threshold: 0,
        source: true
    });

    if (broadcastableBlocks.size > 0) {
        const blockToBroadcastKey = broadcastableBlocks.keys().next();
        const blockToBroadcastValue = broadcastableBlocks.values().next();

        wss.broadcast("You have received a pending " + blockToBroadcastValue.value / 1.0e+30 + "XRB donation!");
        broadcastedBlocks.set(blockToBroadcastKey.value, blockToBroadcastValue.value);
        broadcastableBlocks.delete(blockToBroadcastKey.value);
    }

    if(broadcastedBlocks.size > MAX_PENDING_TRANSACTIONS) {
        const firstKey = broadcastedBlocks.keys().next().value;
        broadcastedBlocks.delete(firstKey);
    }


    Object.keys(pendingTransactions.blocks).forEach(hash => {
        if (!broadcastedBlocks.get(hash) && !broadcastableBlocks.get(hash)) {
            broadcastableBlocks.set(hash, pendingTransactions.blocks[hash].amount);
        }
    });


    if (!isIntervalSet) {
        setInterval(requestPending, 5000);
        isIntervalSet = true;
    }
}

function createClientRequest() {
    const ws = new WebSocket(`wss://localhost:${server.address().port}`, {
        rejectUnauthorized: false
    });

    ws.on('message', (message) => {
        console.log(message)
    })
}

function startServer() {
    server.listen(8080, function () {
        console.log('Extension Boilerplate service running on https');

        setRoutes();
        createClientRequest();
    });
}

startServer();