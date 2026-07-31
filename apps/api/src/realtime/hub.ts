import type { Server as SocketServer } from 'socket.io';
import type { DriverLocation, Order } from '@foodstra/shared';

let io: SocketServer | null = null;

export function setIo(server: SocketServer): void {
  io = server;
}

const orderRoom = (orderId: string): string => `order:${orderId}`;

export function emitOrderStatus(order: Order): void {
  io?.to(orderRoom(order.id)).emit('order:status', {
    orderId: order.id,
    status: order.status,
    updatedAt: order.updatedAt,
  });
}

export function emitDriverLocation(loc: DriverLocation): void {
  io?.to(orderRoom(loc.orderId)).emit('order:location', loc);
}
