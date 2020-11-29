import Rooms from "./rooms.ts";
import type { RoomEvent } from "./types.ts";

enum Events {
  RoomCreate = "room-created",
  RoomJoin = "room-joined",
}

export function interpret(event: RoomEvent) {
  switch (event.kind) {
    case Events.RoomCreate:
      return Rooms.create(event.data);
    case Events.RoomJoin:
      return Rooms.join(event.data);
  }
}
