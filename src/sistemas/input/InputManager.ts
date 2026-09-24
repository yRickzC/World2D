export interface InputCallbacks {
  onInteract?: () => void;
  onToggleInventory?: () => void;
  onToggleMenu?: () => void;
  onToggleMiniMap?: () => void;
  onSelectHotbarIndex?: (index: number) => void;
  onCycleHotbar?: (delta: number) => void;
}

export class InputManager {
  private activeKeys: Record<string, boolean> = {};
  private callbacks: InputCallbacks = {};
  private isAttached: boolean = false;

  constructor(callbacks?: InputCallbacks) {
    if (callbacks) {
      this.callbacks = callbacks;
    }
  }

  setCallbacks(callbacks: InputCallbacks) {
    this.callbacks = callbacks;
  }

  isKeyPressed(code: string): boolean {
    return !!this.activeKeys[code];
  }

  getMovementVector(): { x: number; y: number } {
    let x = 0;
    let y = 0;

    if (this.activeKeys['ArrowLeft'] || this.activeKeys['KeyA']) x -= 1;
    if (this.activeKeys['ArrowRight'] || this.activeKeys['KeyD']) x += 1;
    if (this.activeKeys['ArrowUp'] || this.activeKeys['KeyW']) y -= 1;
    if (this.activeKeys['ArrowDown'] || this.activeKeys['KeyS']) y += 1;

    return { x, y };
  }

  isShiftPressed(): boolean {
    return !!(this.activeKeys['ShiftLeft'] || this.activeKeys['ShiftRight']);
  }

  attach() {
    if (this.isAttached || typeof window === 'undefined') return;
    this.isAttached = true;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('wheel', this.handleWheel, { passive: false });
  }

  detach() {
    if (!this.isAttached || typeof window === 'undefined') return;
    this.isAttached = false;
    this.activeKeys = {};
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('wheel', this.handleWheel);
  }

  clear() {
    this.activeKeys = {};
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Ignore gameplay input if user is typing in an input element or modal editor
    const target = e.target as HTMLElement | null;
    const active = document.activeElement as HTMLElement | null;
    const isInputFocused =
      (target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        target.closest('input, textarea, select, [contenteditable="true"]') !== null
      )) ||
      (active && (
        active.tagName === 'INPUT' ||
        active.tagName === 'TEXTAREA' ||
        active.tagName === 'SELECT' ||
        active.isContentEditable ||
        active.closest('input, textarea, select, [contenteditable="true"]') !== null
      ));

    if (isInputFocused) {
      return;
    }

    // Number keys 1-9 for hotbar selection
    if (e.code.startsWith('Digit')) {
      const num = parseInt(e.code.replace('Digit', ''), 10);
      if (num >= 1 && num <= 9) {
        e.preventDefault();
        this.callbacks.onSelectHotbarIndex?.(num - 1);
        return;
      }
    }

    // Inventory toggle [E] or [I]
    if (e.code === 'KeyE' || e.code === 'KeyI') {
      e.preventDefault();
      this.callbacks.onToggleInventory?.();
      return;
    }

    // Escape toggle Menu / close modal
    if (e.code === 'Escape') {
      e.preventDefault();
      this.callbacks.onToggleMenu?.();
      return;
    }

    // Mini-map toggle [M]
    if (e.code === 'KeyM') {
      e.preventDefault();
      this.callbacks.onToggleMiniMap?.();
      return;
    }

    // Interaction key [Space]
    if (e.code === 'Space') {
      e.preventDefault();
      this.callbacks.onInteract?.();
      return;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }

    this.activeKeys[e.code] = true;
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.activeKeys[e.code] = false;
  };

  private handleWheel = (e: WheelEvent) => {
    // Prevent default scroll and cycle hotbar
    if (Math.abs(e.deltaY) > 5) {
      const delta = e.deltaY > 0 ? 1 : -1;
      this.callbacks.onCycleHotbar?.(delta);
    }
  };
}
