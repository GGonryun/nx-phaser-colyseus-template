import { MapSchema, Schema, type } from '@colyseus/schema';

export class Player extends Schema {
  @type('number') x = 0;
  @type('number') y = 0;

  inputQueue: PlayerInput[] = [];
}

export class MyRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}

export const movePlayer = (input: PlayerInput, player: Player) => {
  const velocity = 2;
  if (input.left) {
    player.x -= velocity;
  } else if (input.right) {
    player.x += velocity;
  }

  if (input.up) {
    player.y -= velocity;
  } else if (input.down) {
    player.y += velocity;
  }
};

export type PlayerInput = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};
