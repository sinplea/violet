import { serve } from "https://deno.land/std@0.79.0/http/server.ts";
import {
  acceptWebSocket,
  isWebSocketCloseEvent,
  isWebSocketPingEvent,
  WebSocket,
} from "https://deno.land/std@0.79.0/ws/mod.ts";

async function handleWs(ws: WebSocket) {
  console.log("socket connected!");

  try {
    for await (const ev of ws) {
      if (typeof ev === "string") {
        // text message.
        console.log("ws:Text", ev);
        await ws.send(ev);
      } else if (ev instanceof Uint8Array) {
        // binary message.
        console.log("ws:Binary", ev);
      } else if (isWebSocketPingEvent(ev)) {
        const [, body] = ev;
        // ping.
        console.log("ws:Ping", body);
      } else if (isWebSocketCloseEvent(ev)) {
        // close.
        const { code, reason } = ev;
        console.log("ws:Close", code, reason);
      }
    }
  } catch (err) {
    console.error(`failed to receive frame: ${err}`);

    if (!ws.isClosed) {
      await ws.close(1000).catch(console.error);
    }
  }
}

if (import.meta.main) {
  /** websocket echo server */
  const port = 8080;
  console.log(`websocket server is running on :${port}`);

  for await (const req of serve({ port })) {
    const { conn, r: bufReader, w: bufWriter, headers } = req;
    const _file = await Deno.readFile("public/index.html");
    const decoder = new TextDecoder();

    if (!req.headers.has("upgrade")) {
      console.log("Requested static html");
      await req.respond({
        status: 200,
        headers: new Headers({
          "content-type": "text/html",
        }),
        body: decoder.decode(_file),
      });
    } else {
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
    }
  }
}
