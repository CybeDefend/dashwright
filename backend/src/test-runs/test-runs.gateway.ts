import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { TestRun } from '../entities';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
})
export class TestRunsGateway {
  @WebSocketServer()
  server: Server;

  notifyTestRunCreated(testRun: TestRun) {
    this.server.emit('test-run:created', testRun);
  }

  notifyTestRunUpdated(testRun: TestRun) {
    this.server.emit('test-run:updated', testRun);
  }

  @SubscribeMessage('subscribe:test-run')
  handleSubscribeToTestRun(@MessageBody() testRunId: string) {
    return { event: 'subscribed', data: { testRunId } };
  }
}
