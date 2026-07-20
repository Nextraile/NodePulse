process.loadEnvFile('.env');
import appConfig from './config/environment.js';
import * as tcpServer from './network/tcp-server.js';

console.log("(index): Starting application...");
tcpServer.startServer(appConfig.networks.tcp.port);