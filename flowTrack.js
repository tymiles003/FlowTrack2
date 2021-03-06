#!/usr/bin/env node

/*jslint node: true */
'use strict';
var cluster = require('cluster');
var netflow = require('node-netflowv9');
var numCPUs = require('os').cpus().length;
var es = require('elasticsearch');
var NetFlowStorage = require('./lib/NetFlowStorage');

var getLogger = require('./lib/getLogger');
var logger = getLogger(process.env.NODE_ENV);

main();

function main() {

    var nfStore = new NetFlowStorage(es, logger);


    if (cluster.isMaster) {

        // Setup, then fork the workers
        nfStore.createIndex();

        for (var i = 0; i < numCPUs; i++) {
            cluster.fork();
        }


    } else {
        // Setup the worker
        netflow(function(flow) {

            logger.info('%s\t flows', flow.flows.length);
            for (var i = 0; i < flow.flows.length; i++) {
                nfStore.storeFlow(flow.flows[i]);
            }
        }).listen(2055);
    }
}