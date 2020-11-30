import {
  serve,
  ServerRequest,
} from "https://deno.land/std@0.79.0/http/server.ts";
import {
  acceptWebSocket,
  WebSocket,
} from "https://deno.land/std@0.79.0/ws/mod.ts";
import { connect } from "https://deno.land/x/redis/mod.ts";
import { interpret } from "./events.ts";
import type { RoomEvent } from "./types.ts";

const redis = await connect({
  hostname: Deno.args[1] ? Deno.args[1] : "127.0.0.1",
  port: 6379,
});

async function handleWs(ws: WebSocket) {
  console.log("socket connected!");

  try {
    for await (const ev of ws) {
      if (typeof ev === "string") {
        // Try to parse into json
        const jsonEvent: RoomEvent = JSON.parse(ev);
        console.log(`Socket sent: ${ev} \n`);
        interpret(redis, jsonEvent);

        await ws.send(ev);
      }
    }
  } catch (err) {
    console.error(`failed to receive frame: ${err}`);

    if (!ws.isClosed) {
      await ws.close(1000).catch(console.error);
    }
  }
}

async function handleStatic(req: ServerRequest) {
  const _file = await Deno.readFile("public/index.html");
  const decoder = new TextDecoder();

  await req.respond({
    status: 200,
    headers: new Headers({
      "content-type": "text/html",
    }),
    body: decoder.decode(_file),
  });
}

if (import.meta.main) {
  /** websocket echo server */
  const port = Deno.args[0] ? Number(Deno.args[0]) : 8080;
  console.log(`websocket server is running on :${port}`);

  for await (const req of serve({ port })) {
    const { conn, r: bufReader, w: bufWriter, headers } = req;

    if (req.headers.has("upgrade")) {
      console.log("Requested websocket conn");
      acceptWebSocket({
        conn,
        bufReader,
        bufWriter,
        headers,
      })
        .then(handleWs)
        .catch(async (err) => {
          console.error(`failed to accept websocket: ${err}`);
          console.log(`failed request of type: ${req.method}`);
          await req.respond({ status: 400 });
        });
    } else {
      await handleStatic(req);
    }
  }
}
