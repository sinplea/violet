export type RoomCreatedEvent = {
  kind: "room-created";
  socket_id: string;
  details: {
    thumbnail: string;
    title: string;
    topic: string;
    watchers: string;
    visibility: string;
  };
};

export type RoomJoinedEvent = {
  kind: "room-joined";
  room_id: string;
  prev_room_id: string;
  socket_id: string;
};

export type RoomEvent =
  | RoomCreatedEvent
  | RoomJoinedEvent;
