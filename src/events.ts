import Rooms from "./rooms.ts";
import type { Redis } from "https://deno.land/x/redis/mod.ts";
import type { RoomEvent } from "./types.ts";

enum Events {
  RoomCreate = "room-created",
  RoomJoin = "room-joined",
}

export function interpret(redis: Redis, event: RoomEvent) {
  switch (event.kind) {
    case Events.RoomCreate:
      return Rooms.create(redis, event);
    case Events.RoomJoin:
      return Rooms.join(redis, event);
  }
}
