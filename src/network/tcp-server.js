import net from "net";

const server = net.createServer((socket) => {
  handleSocketConnect(socket);
  handleSocketData(socket);
  handleSocketError(socket);
  handleSocketClose(socket);
});

export function startServer(port) {
  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

export function stopServer() {
  server.close(() => {
    console.log("Server closed");
  });
}

function handleSocketConnect(socket) {
  socket.on("connect", () => {
    console.log("Socket connected");
  });
}

function handleSocketData(socket) {
  socket.on("data", (data) => {
    console.log(`Received data: ${data}`);
  });
}

function handleSocketError(socket) {
  socket.on("error", (err) => {
    console.error(`Socket error: ${err.code} | ${err.message}`);
    socket.destroy();
  });
}

function handleSocketClose(socket) {
  socket.on("close", (hadError) => {
    console.log(`Socket closed${hadError ? " due to error" : ""}`);
  });
}