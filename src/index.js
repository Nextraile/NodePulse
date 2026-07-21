process.loadEnvFile('.env');
import appConfig from './config/environment.js';
import * as tcpServer from './network/tcp-server.js';
import * as protocol from './network/protocol.js';

console.log("(index): Starting application...");
const tcpServerInstance = tcpServer.startServer(appConfig.networks.tcp.port);

tcpServer.handleStreamError(tcpServerInstance, (err) => {
  console.error(`(index): Error occurred: ${err.message}`);
});

tcpServer.handleDataStream(tcpServerInstance, (data) => {
  const parsedData = protocol.parseBuffer(data);
  console.log(`(index): Received data: ${JSON.stringify(parsedData)}`);
});