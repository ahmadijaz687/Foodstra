import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { OrderStatus } from '@foodstra/shared';
import { baseUrl } from '../api/client';
import { loadTokens } from '../auth/storage';

export interface LiveLocation {
  latitude: number;
  longitude: number;
}

interface OrderLive {
  status: OrderStatus | null;
  location: LiveLocation | null;
  connected: boolean;
}

/** Subscribes to the per-order realtime room for status + driver location. */
export function useOrderSocket(orderId: string): OrderLive {
  const [state, setState] = useState<OrderLive>({
    status: null,
    location: null,
    connected: false,
  });

  useEffect(() => {
    let socket: Socket | null = null;
    let cancelled = false;

    void (async () => {
      const tokens = await loadTokens();
      if (!tokens || cancelled) return;
      socket = io(baseUrl, {
        auth: { token: tokens.accessToken },
        transports: ['websocket'],
      });
      socket.on('connect', () => {
        setState((s) => ({ ...s, connected: true }));
        socket?.emit('order:subscribe', orderId);
      });
      socket.on('disconnect', () =>
        setState((s) => ({ ...s, connected: false })),
      );
      socket.on('order:status', (payload: { status: OrderStatus }) => {
        setState((s) => ({ ...s, status: payload.status }));
      });
      socket.on(
        'order:location',
        (payload: { latitude: number; longitude: number }) => {
          setState((s) => ({
            ...s,
            location: {
              latitude: payload.latitude,
              longitude: payload.longitude,
            },
          }));
        },
      );
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [orderId]);

  return state;
}
