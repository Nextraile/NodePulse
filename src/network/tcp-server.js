import net from "net";
import * as appConfig from "../config/environment.js";

const server = net.createServer();

server.on("listening", () => handleSocketListening(server.address().port));
server.on("connection", (socket) => {
  handleSocketConnection(socket.remoteAddress, socket.remotePort);
  socket.setTimeout(appConfig.networks.tcp.timeout);
  handleSocketSetTimeout(appConfig.networks.tcp.timeout);
});
server.on("data", (chunk) => handleSocketData(chunk));
server.on("drain", () => handleSocketDrain());
server.on("timeout", () => handleSocketTimeout());
server.on("end", () => handleSocketEnd());
server.on("error", (err) => handleSocketError(err));
server.on("close", (hadError) => handleSocketClose(hadError));

export function startServer(port) { server.listen(port) }
export function stopServer() { server.close(() => { console.log(`(tcp-server.stopServer): [SERVER] Now closed`) }) }

//=================
// HELPER FUNCTIONS
//=================
function handleSocketListening(port) { console.log(`(tcp-server.handleSocketListening): [SERVER] Now listening on port ${port}`) }
function handleSocketConnection(address, port) { console.log(`(tcp-server.handleSocketConnection): [SERVER] New client connected from ${address}:${port}`) }
function handleSocketSetTimeout(timeout) { console.log(`(tcp-server.handleSocketSetTimeout): [SERVER] Socket timeout set to ${timeout} ms`) }
function handleSocketData(chunk) {
  console.log(`(tcp-server.handleSocketData): [SERVER] Received data chunk: ${chunk}`);
  const statusFlushed = server.write(`Data fully received`);
  if (!statusFlushed) console.log(`(tcp-server.handleSocketData): [SERVER] Buffer full. Waiting for 'drain' event...`);
}
function handleSocketDrain() { console.log(`(tcp-server.handleSocketDrain): [SERVER] Buffer drained. Ready to send more data.`) }
function handleSocketTimeout() { console.warn(`(tcp-server.handleSocketTimeout): [SERVER] Socket timeout reached. Closing socket...`) }
function handleSocketEnd() { console.log(`(tcp-server.handleSocketEnd): [SERVER] Socket ended by client.`) }
function handleSocketError(err) {
  console.error(`(tcp-server.handleSocketError): [SERVER] Socket error. code: ${err.code} | message: ${err.message}`);
  socket.destroy();
}
function handleSocketClose(hadError) { console.log(`(tcp-server.handleSocketClose): [SERVER] Socket closed${hadError ? " due to error" : ""}`) }