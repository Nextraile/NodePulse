import net from "net";

const server = net.createServer((socket) => {
  socket.on("connect", () => handleSocketConnect());
  socket.on("data", (data) => handleSocketData(data));
  socket.on("error", (err) => handleSocketError(err));
  socket.on("close", (hadError) => handleSocketClose(hadError));
});

export function startServer(port) { server.listen(port, () => { console.log(`(tcp-server.startServer): Server listening on port ${port}`) }) }
export function stopServer() { server.close(() => { console.log(`(tcp-server.stopServer): Server closed`) }) }

function handleSocketConnect() { console.log(`(tcp-server.handleSocketConnect): Socket connected`) }
function handleSocketData(data) { console.log(`(tcp-server.handleSocketData): Received data: ${data}`) }
function handleSocketError(err) {
  console.error(`(tcp-server.handleSocketError): Socket error. code: ${err.code} | message: ${err.message}`);
  socket.destroy();
}
function handleSocketClose(hadError) { console.log(`(tcp-server.handleSocketClose): Socket closed${hadError ? " due to error" : ""}`) }