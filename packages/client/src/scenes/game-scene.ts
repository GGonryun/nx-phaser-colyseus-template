import { Client, Room } from 'colyseus.js';
import Phaser from 'phaser';
import { MyRoomState, PlayerInput } from 'shared';

export class GameScene extends Phaser.Scene {
  cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  remoteRef: Phaser.GameObjects.Rectangle;
  currentPlayer: Phaser.GameObjects.Image;
  playerEntities: { [sessionId: string]: Phaser.GameObjects.Image } = {};
  elapsedTime = 0;
  fixedTimeStep = 1000 / 60;
  client = new Client('ws://localhost:2567');
  room: Room<MyRoomState>;
  inputPayload: PlayerInput = {
    left: false,
    right: false,
    up: false,
    down: false,
  };

  constructor() {
    super('game');
  }

  preload() {
    this.cursorKeys = this.input.keyboard?.createCursorKeys();

    this.load.image(
      'ship_0001',
      'https://cdn.glitch.global/3e033dcd-d5be-4db4-99e8-086ae90969ec/ship_0001.png'
    );
  }

  async create() {
    console.log('joining room');

    try {
      this.room = await this.client.joinOrCreate<MyRoomState>('basic_room');
      console.log('joined room');
      this.room.state.players.onAdd((player: any, sessionId: any) => {
        console.log(
          'A player has joined! Their unique session id is',
          sessionId
        );
        const entity = this.add.image(player.x, player.y, 'ship_0001');
        this.playerEntities[sessionId] = entity;

        if (sessionId === this.room.sessionId) {
          console.log('This player is me!');
          this.currentPlayer = entity;
        } else {
          player.listen('x', (newX: number, prevX: number) => {
            entity.setData('serverX', newX);
          });
          player.listen('y', (newY: number, prevY: number) => {
            entity.setData('serverY', newY);
          });
        }
      });
      this.room.state.players.onRemove((player: any, sessionId: any) => {
        const entity = this.playerEntities[sessionId];
        if (entity) {
          console.log(
            'A player has left! Their unique session id was',
            sessionId
          );
          entity.destroy();
          delete this.playerEntities[sessionId];
        } else {
          console.warn(
            'A player has left, but their entity was not found. Their unique session id was',
            sessionId
          );
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  fixedTick(time: number, delta: number): void {
    const keys = this.cursorKeys;
    if (!keys) return;
    if (!this.currentPlayer) return;
    if (!this.room) return;

    const velocity = 2;

    this.inputPayload.left = keys.left.isDown;
    this.inputPayload.right = keys.right.isDown;
    this.inputPayload.up = keys.up.isDown;
    this.inputPayload.down = keys.down.isDown;

    this.room.send(0, this.inputPayload);

    if (this.inputPayload.left) {
      this.currentPlayer.x -= velocity;
    } else if (this.inputPayload.right) {
      this.currentPlayer.x += velocity;
    }

    if (this.inputPayload.up) {
      this.currentPlayer.y -= velocity;
    } else if (this.inputPayload.down) {
      this.currentPlayer.y += velocity;
    }

    for (const sessionId in this.playerEntities) {
      if (sessionId === this.room.sessionId) continue;

      const entity = this.playerEntities[sessionId];
      const serverX = entity.getData('serverX');
      const serverY = entity.getData('serverY');
      entity.x = Phaser.Math.Linear(entity.x, serverX, 0.2);
      entity.y = Phaser.Math.Linear(entity.y, serverY, 0.2);
    }
  }

  update(time: number, delta: number): void {
    if (!this.currentPlayer) return;

    this.elapsedTime += delta;
    while (this.elapsedTime >= this.fixedTimeStep) {
      this.elapsedTime -= this.fixedTimeStep;
      this.fixedTick(time, this.fixedTimeStep);
    }
  }
}
