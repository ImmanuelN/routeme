// Simple event bus for lightweight cross-component notifications
const listeners = {};

export const on = (event, cb) => {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(cb);
  return () => {
    listeners[event] = (listeners[event] || []).filter((f) => f !== cb);
  };
};

export const off = (event, cb) => {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter((f) => f !== cb);
};

export const emit = (event, payload) => {
  (listeners[event] || []).forEach((cb) => {
    try {
      cb(payload);
    } catch (err) {
      // swallow to avoid crashing emitter
      console.warn('⚠️ [eventBus] handler error', err?.message || err);
    }
  });
};

export default { on, off, emit };
