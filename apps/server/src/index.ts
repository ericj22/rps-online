import { createServer } from "http";
import { createHttpHandler } from "./server/http";
import { RoomManager } from "./server/room-manager";
import { registerSocketServer } from "./server/socket";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const roomManager = new RoomManager();
const httpServer = createServer(createHttpHandler(roomManager));

registerSocketServer(httpServer, roomManager);

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
})
