"use strict";

const { default: Rai } = require('raiblocks-js');
const express = require('express');
const fs = require('fs');
const https = require('https');

const app = express();
const rai = new Rai('xrb_38s5duq85sjm59nonxantc94r4k4ogewx86a1dibjc9q64eganu3s9acztko');

app.use((req, res, next) => {
  console.log('Got request', req.path, req.method);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return next();
});

app.use(express.static('../frontend'));

app.get('/blocks', async (req, res) => {
    const numblocks = await rai.blocks.count();
    console.log(numblocks)
	return res.json({blocks: numblocks});
});

let options = {
   key  : fs.readFileSync('/boilerplate/certs/testing.key'),
   cert : fs.readFileSync('/boilerplate/certs/testing.crt')
};

const PORT = 8080;
https.createServer(options, app).listen(PORT, function () {
  console.log('Extension Boilerplate service running on https', PORT);
});
