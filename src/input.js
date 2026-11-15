const BLOCKED_CODES = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);

export function createInput(canvas) {
  const keys = new Set();
  const justPressed = new Set();
  const mouse = { x: 0, y: 0, down: false, clicked: false };

  const onKeyDown = (event) => {
    if (BLOCKED_CODES.has(event.code)) event.preventDefault();
    if (!event.repeat && !keys.has(event.code)) justPressed.add(event.code);
    keys.add(event.code);
  };
  const onKeyUp = (event) => {
    if (BLOCKED_CODES.has(event.code)) event.preventDefault();
    keys.delete(event.code);
  };
  const onBlur = () => keys.clear();
  const updateMousePosition = (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (event.clientY - rect.top) * (canvas.height / rect.height);
  };
  const onPointerDown = (event) => {
    updateMousePosition(event);
    if (event.button !== undefined && event.button !== 0) return;
    if (!mouse.down) mouse.clicked = true;
    mouse.down = true;
  };
  const onPointerUp = (event) => {
    updateMousePosition(event);
    if (event.button === undefined || event.button === 0) mouse.down = false;
  };

  window.addEventListener('keydown', onKeyDown, { passive: false });
  window.addEventListener('keyup', onKeyUp, { passive: false });
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('pointermove', updateMousePosition);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);

  return {
    keys,
    justPressed,
    mouse,
    axis() {
      const x = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));
      const y = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp'));
      const length = Math.hypot(x, y);
      return length > 0 ? { x: x / length, y: y / length } : { x: 0, y: 0 };
    },
    pressed(code) { return justPressed.has(code); },
    postUpdate() {
      justPressed.clear();
      mouse.clicked = false;
    },
  };
}
