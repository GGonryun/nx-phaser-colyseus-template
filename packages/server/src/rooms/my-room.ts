import { Room, Client } from '@colyseus/core';
import { movePlayer, MyRoomState, Player, PlayerInput } from 'shared';

export class MyRoom extends Room<MyRoomState> {
  maxClients = 4;
  fixedTimeStep = 1000 / 60;

  onCreate(options: any) {
    this.setState(new MyRoomState());

    this.onMessage(0, (client, message) => {
      const player = this.state.players.get(client.sessionId);

      player.inputQueue.push(message);
    });

    let elapsedTime = 0;
    this.setSimulationInterval((deltaTime) => {
      elapsedTime += deltaTime;

      while (elapsedTime >= this.fixedTimeStep) {
        this.fixedTick(this.fixedTimeStep);
        elapsedTime -= this.fixedTimeStep;
      }
    });
  }

  fixedTick(deltaTime: number) {
    this.state.players.forEach((player) => {
      let input: PlayerInput;

      while ((input = player.inputQueue.shift())) {
        movePlayer(input, player);
      }
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, 'joined!');
    const map = { width: 800, height: 600 };
    const player = new Player();

    player.x = Math.floor(Math.random() * map.width);
    player.y = Math.floor(Math.random() * map.height);

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, 'left!');

    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...');
  }
}
