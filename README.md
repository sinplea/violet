# Violet
Violet is an example backend service for my ongoing project, Watch Party. [(See watch-party README.md)](https://github.com/sinplea/watch-party).

*It's a basic webserver that accepts websocket connections and handles events to build [Redis](https://redis.com/) data structures. The problem it tries to solve is Room Management. Sockets can only be apart of one room at a time. Queries concerning rooms, the number of sockets in that room, and other room details all need to be managed by this service.*

## Table of Contents

- [Violet](#violet)
  - [Table of Contents](#table-of-contents)
  - [Tech](#tech)
  - [Setup](#setup)
  - [How It Works](#how-it-works)
    - [src/public/index.html](#srcpublicindexhtml)
    - [src/server.ts](#srcserverts)
  - [Why Deno?](#why-deno)
  - [Why Redis?](#why-redis)
  - [License](#license)
  - [Contact](#contact)


## Tech

* [Deno](https://deno.land) | Secure Typescript Environment
* [Typescript](https://typscriptlang.org) | Type Checking
* [Websockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) | Real time event transfer
* [Redis](https://redis.com) | In-memory data structures for fast queries.

## Setup
1. Clone the repo
```sh
git clone https://github.com/sinplea/violet
```
2. Install Redis ([instructions](https://redis.io/download))
```sh
# Run the cli
redis-cli
```
3. Start the server
```sh
deno run --allow-net --allow-read src/server.ts
# or give SERVER_PORT and REDIS_HOST
deno run --allow-net --allow-read src/server.ts 8080 127.0.0.1
```
4. Navigate to localhost:8080 in a browser window.

## How It Works

### [src/public/index.html](src/public)

Has a button with some static data, modeled as an event.

```js
...
<body>
  <button>Click to Create Room</button>
  <script>
    const button = document.querySelector('button');
    const socket = new WebSocket('ws://localhost:8080');

    button.addEventListener('click', event => {
      const roomJoinedEvent = {
        kind: 'room-joined',
        room_id: 'ROOM:2',
        prev_room_id: 'ROOM:1',
        socket_id: 'SOCKET:1'
      };

      const roomCreatedEvent = {
        kind: 'room-created',
        socket_id: 'Socket:1',
        details: {
          thumbnail: 'url://thumbnail',
          title: 'Perfect Blue',
          topic: 'Satoshi Kon clips',
          watchers: '2',
          visibility: 'Public',
        },
      };

      socket.send(JSON.stringify(roomCreatedEvent));
    });
...
```

Events are based on [src/types.ts](src/types.ts).

```ts
...
export type RoomJoinedEvent = {
  kind: "room-joined";
  room_id: string;
  prev_room_id: string;
  socket_id: string;
};

export type RoomEvent =
  | RoomCreatedEvent
  | RoomJoinedEvent;

```

### [src/server.ts](src/server.ts)

Handles the event

```ts
...
async function handleWs(ws: WebSocket) {
  console.log("socket connected!");

  try {
    for await (const ev of ws) {
      if (typeof ev === "string") {
        // Try to parse into json
        const jsonEvent: RoomEvent = JSON.parse(ev);
        console.log(`Socket sent: ${ev} \n`);
        interpret(redis, jsonEvent);
...
```

Event type is determined and Redis is called. Redis in this example is managing 3 different data structures to manage the different queries I might expect from the client.

```text
Set -> For easily calculating real-time viewership.
ZSet ->  For easily finding popular rooms.
Hash -> For storing details for lookup
```

I'm not sure if this is common practice in redis. (To design your data structures around the queries you expect the user to ask for). If not, send me a message or create issue to explain a better approach. (I would appreciate it)!

## Why Deno?
Because I'm working on improving my Typescript skills, and I wanted to see what is was like to work with a Javascript based backend without the dependency hell of Node.

## Why Redis?
Redis may seem like a strange choice, but I think:
 * Redis is a suitable solution for room management. Rooms are easily created on a whim by a user. 
 * They are also destroyed as soon as soon as they are empty. 
 * The ephemeral nature of a "room" seems to make more sense, to me, on Redis than it does in a dedicated document store like MongoDB or a relational database like MYSQL

That being said, there's no reason you couldn't use some other storage method as is often the case with most problems. But, I wanted to learn how to use Redis, and I like how redis really makes you considered how it is your data will be queried in order to define what structures should be used.

## License

Distributed under the MIT License. See `LICENSE` for more information.

<!-- CONTACT -->
## Contact

Alex Werner - [@sinplea_](https://twitter.com/@sinplea_) - alexanderdwerner@gmail.com

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[stars-shield]: https://img.shields.io/github/stars/sinplea/repo.svg?style=flat-square