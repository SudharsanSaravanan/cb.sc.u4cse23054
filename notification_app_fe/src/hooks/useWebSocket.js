import { useEffect, useRef } from 'react';

const WS_URL = 'ws://localhost:5000';
const RECONNECT_DELAY = 3000;

export function useWebSocket(onMessage) {
  const wsRef = useRef(null);
  const timerRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(WS_URL);

      ws.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.event !== 'ping') onMessageRef.current(payload);
        } catch {}
      };

      ws.onclose = () => {
        timerRef.current = setTimeout(connect, RECONNECT_DELAY);
      };

      ws.onerror = () => ws.close();

      wsRef.current = ws;
    }

    connect();

    return () => {
      clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, []);
}
