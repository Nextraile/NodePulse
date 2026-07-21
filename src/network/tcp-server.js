import net from "net";
import appConfig from "../config/environment.js";

const server = net.createServer();

server.on("listening", () => handleSocketListening(server.address().port));
server.on("connection", (socket) => {
  handleSocketConnection(socket.remoteAddress, socket.remotePort);
  socket.setTimeout(appConfig.networks.tcp.timeout);
  handleSocketSetTimeout(appConfig.networks.tcp.timeout);
});
server.on("drain", () => handleSocketDrain());
server.on("timeout", () => handleSocketTimeout());
server.on("end", () => handleSocketEnd());
server.on("close", (hadError) => handleSocketClose(hadError));

export function startServer(port) { server.listen(port) }
export function stopServer() { server.close(() => { console.log(`(tcp-server.stopServer): [SERVER] Now closed`) }) }
export function handleDataStream(socket, callback) { socket.on("data", (chunk) => handleSocketData(chunk, callback)) }
export function handleStreamError(socket, callback) { socket.on("error", (err) => handleSocketError(err, callback)) }

//=================
// HELPER FUNCTIONS
//=================
function handleSocketListening(port) { console.log(`(tcp-server.handleSocketListening): [SERVER] Now listening on port ${port}`) }
function handleSocketConnection(address, port) { console.log(`(tcp-server.handleSocketConnection): [SERVER] New client connected from ${address}:${port}`) }
function handleSocketSetTimeout(timeout) { console.log(`(tcp-server.handleSocketSetTimeout): [SERVER] Socket timeout set to ${timeout} ms`) }
function handleSocketData(chunk, callback) {
  if (typeof callback !== "function") throw new Error(`(tcp-server.handleSocketData): [SERVER] Callback function is required`);
  console.log(`(tcp-server.handleSocketData): [SERVER] Received data chunk: ${chunk}`);

  const lengthPrefix = 4; // in bytes
  let mainBuffer = Buffer.alloc(0); // initialize an empty buffer to accumulate incoming data
  let expectedLength = null;

  while (true) {
    mainBuffer = Buffer.concat([mainBuffer, chunk]); // accumulate the incoming data into the main buffer

    // check if the data is enough to read the length prefix
    if (expectedLength === null && mainBuffer.length >= lengthPrefix) {
      expectedLength = mainBuffer.readUInt32BE(0); // read the length prefix as a big-endian integer
      mainBuffer = mainBuffer.subarray(lengthPrefix); // remove the length prefix from the main buffer
      console.log(`(tcp-server.handleSocketData): [SERVER] Expected data length: ${expectedLength}`);
    }

    // check if the complete data has been received
    if (expectedLength !== null && mainBuffer.length >= expectedLength) {
      mainBuffer = mainBuffer.subarray(0, expectedLength); // extract the actual data
      console.log(`(tcp-server.handleSocketData): [SERVER] Complete data received: ${mainBuffer.toString('utf-8')}`);
      callback(mainBuffer);

      // reset the main buffer and expected length for the next message
      mainBuffer = Buffer.alloc(0);
      expectedLength = null;

      break;
    } else {
      console.log(`(tcp-server.handleSocketData): [SERVER] Waiting for more data...`);
      break;
    }
  }

  const statusFlushed = server.write(`Data fully received`);
  if (!statusFlushed) console.log(`(tcp-server.handleSocketData): [SERVER] Buffer full. Waiting for 'drain' event...`);
}
function handleSocketDrain() { console.log(`(tcp-server.handleSocketDrain): [SERVER] Buffer drained. Ready to send more data.`) }
function handleSocketTimeout() { console.warn(`(tcp-server.handleSocketTimeout): [SERVER] Socket timeout reached. Closing socket...`) }
function handleSocketEnd() { console.log(`(tcp-server.handleSocketEnd): [SERVER] Socket ended by client.`) }
function handleSocketError(err, callback) {
  console.error(`(tcp-server.handleSocketError): [SERVER] Socket error. code: ${err.code} | message: ${err.message}`);
  callback(err);
}
function handleSocketClose(hadError) { console.log(`(tcp-server.handleSocketClose): [SERVER] Socket closed${hadError ? " due to error" : ""}`) }