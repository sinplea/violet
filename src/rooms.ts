import { connect } from "https://deno.land/x/redis/mod.ts";
import { v4 } from "https://deno.land/std@0.79.0/uuid/mod.ts";

import type { RoomCreatedEvent, RoomJoinedEvent } from "./types.ts";

enum Visibility {
  Public = "Public",
  Private = "Private",
}

const ROOM_POPULATION_SET_NAME = "watch-party:room_population";
const PUBLIC_ROOMS_ZSET_NAME = "watch-party:public_rooms";
const ROOM_DETAILS_HASH_NAME = "watch-party:room_details";

const redis = await connect({
  hostname: "127.0.0.1",
  port: 6379,
});

// TODO: Handle return types
function cleanupExtraneousRooms(rooms: [string]) {
  rooms.forEach(async (room) => {
    const cardinality = await redis.scard(
      `${ROOM_POPULATION_SET_NAME}:${room}`,
    );
    if (cardinality <= 0) {
      redis.del(`${ROOM_POPULATION_SET_NAME}:${room}`);
      redis.del(`${ROOM_DETAILS_HASH_NAME}:${room}`);
      redis.zrem(PUBLIC_ROOMS_ZSET_NAME, room); // If room doesn't exist, aka private, command is ignored
    }
  });
}

// TODO: Handle return types
async function create(data: RoomCreatedEvent) {
  const uuid = v4.generate();
  const details = Object.entries(data.details);

  redis.sadd(`${ROOM_POPULATION_SET_NAME}:${uuid}`, data.socket_id);

  if (data.details.visibility === Visibility.Public) {
    redis.zadd(`${PUBLIC_ROOMS_ZSET_NAME}`, 1, uuid);
  }

  redis.hset(`${ROOM_DETAILS_HASH_NAME}:${uuid}`, ...details);
}

// TODO: Handle return types
async function join(data: RoomJoinedEvent) {
  const exists: number = await redis.exists(
    `${ROOM_POPULATION_SET_NAME}:${data.room_id}`,
  );

  if (exists) {
    const visibility = await redis.hget(
      `${ROOM_DETAILS_HASH_NAME}:${data.room_id}`,
      "Visibility",
    );

    if (visibility && visibility === Visibility.Public) {
      // Handle old room removal.
      redis.srem(
        `${ROOM_POPULATION_SET_NAME}:${data.prev_room_id}`,
        data.socket_id,
      );
      redis.zincrby(PUBLIC_ROOMS_ZSET_NAME, -1, data.prev_room_id);

      // Handle new room join
      redis.sadd(`${ROOM_POPULATION_SET_NAME}:${data.room_id}`, data.socket_id);
      redis.zincrby(`${PUBLIC_ROOMS_ZSET_NAME}`, 1, data.room_id);

      // Clean up
      cleanupExtraneousRooms([data.prev_room_id]);
    }
  }
}

export default {
  join,
  create,
};
