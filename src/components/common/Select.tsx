import React, {
  Children,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

/**
 * Global dropdown. Replaces the native <select>, whose popup the browser draws in OS
 * colours and which ignores the glass theme. Everything visual lives in index.css
 * (`.titik-select`, `.titik-menu`, `.titik-option`) and reads the theme tokens, so it
 * follows the light/dark switch with no theme logic here.
 *
 * Drop-in for <select>: pass <option> children or an `options` array. `onChange`
 * receives the value, not an event.
 *
 * - The menu renders in a portal, so a modal's overflow can't clip it, and flips
 *   upward when there is no room below.
 * - Focus stays on the trigger (aria-activedescendant), so modal focus traps keep working.
 * - Escape is stopped here: modals listen for it on window and would close with the menu.
 */

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  /** Either this or <option> children. */
  options?: SelectOption[];
  children?: React.ReactNode;
  /** Shown when the selected value is empty or matches no option. */
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  size?: 'md' | 'sm';
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const MENU_GAP = 6;
const VIEWPORT_EDGE = 8;
const MENU_MAX_HEIGHT = 320;
const TYPEAHEAD_RESET_MS = 600;

/** Turns <option> children (including fragments, arrays and conditionals) into options. */
function parseOptionChildren(children: React.ReactNode): SelectOption[] {
  const parsed: SelectOption[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const props = child.props as { value?: string | number; children?: React.ReactNode; disabled?: boolean };
    if (child.type === Fragment) {
      parsed.push(...parseOptionChildren(props.children));
    } else if (child.type === 'option') {
      parsed.push({
        value: String(props.value ?? nodeText(props.children)),
        label: props.children,
        disabled: props.disabled,
      });
    }
  });
  return parsed;
}

function nodeText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  if (isValidElement(node)) return nodeText((node.props as { children?: React.ReactNode }).children);
  return '';
}

interface MenuPosition {
  left: number;
  top?: number;
  bottom?: number;
  minWidth: number;
  maxHeight: number;
  openUp: boolean;
}

export function Select<T extends string = string>({
  value,
  onChange,
  options,
  children,
  placeholder = 'Pilih...',
  id,
  className = '',
  disabled = false,
  size = 'md',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: SelectProps<T>) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const typeahead = useRef({ buffer: '', timer: 0 });

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [pos, setPos] = useState<MenuPosition | null>(null);

  const items = useMemo(() => options ?? parseOptionChildren(children), [options, children]);
  const selectedIndex = items.findIndex((item) => item.value === value);
  const selected = selectedIndex >= 0 ? items[selectedIndex] : undefined;
  // A native <select> shows its empty option as the "nothing chosen" state; do the same
  const isPlaceholder = !selected || selected.value === '';
  const triggerLabel = selected && selected.value !== '' ? selected.label : selected?.label || placeholder;

  const isEnabled = (index: number) => index >= 0 && index < items.length && !items[index].disabled;

  const step = useCallback(
    (from: number, direction: 1 | -1) => {
      for (let i = from + direction; i >= 0 && i < items.length; i += direction) {
        if (!items[i].disabled) return i;
      }
      return from;
    },
    [items],
  );

  const firstEnabled = () => step(-1, 1);
  const lastEnabled = () => step(items.length, -1);

  const close = useCallback(() => {
    setOpen(false);
    setPos(null);
  }, []);

  const openMenu = () => {
    if (disabled) return;
    setActiveIndex(isEnabled(selectedIndex) ? selectedIndex : firstEnabled());
    setOpen(true);
  };

  const commit = (index: number) => {
    if (!isEnabled(index)) return;
    close();
    if (items[index].value !== value) onChange(items[index].value as T);
  };

  // Measure the trigger and menu, then place the menu. Runs before paint, so the menu
  // (hidden until `pos` exists) never flashes at the wrong spot.
  const place = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;
    const rect = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (rect.bottom < 0 || rect.top > vh) {
      close();
      return;
    }
    const below = vh - rect.bottom - MENU_GAP - VIEWPORT_EDGE;
    const above = rect.top - MENU_GAP - VIEWPORT_EDGE;
    const natural = Math.min(menu.scrollHeight, MENU_MAX_HEIGHT);
    const openUp = below < natural && above > below;
    const maxHeight = Math.max(120, Math.min(MENU_MAX_HEIGHT, openUp ? above : below));
    let left = rect.left;
    const width = menu.offsetWidth;
    if (left + width > vw - VIEWPORT_EDGE) left = Math.max(VIEWPORT_EDGE, vw - VIEWPORT_EDGE - width);
    const next: MenuPosition = {
      left,
      top: openUp ? undefined : rect.bottom + MENU_GAP,
      bottom: openUp ? vh - rect.top + MENU_GAP : undefined,
      minWidth: rect.width,
      maxHeight,
      openUp,
    };
    setPos((prev) =>
      prev &&
      prev.left === next.left &&
      prev.top === next.top &&
      prev.bottom === next.bottom &&
      prev.minWidth === next.minWidth &&
      prev.maxHeight === next.maxHeight
        ? prev
        : next,
    );
  }, [close]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place, items]);

  // Follow the trigger on scroll/resize; dismiss on outside press
  useEffect(() => {
    if (!open) return;
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
      // Like a native select, the press that dismisses the menu does nothing else:
      // otherwise it would also hit the modal backdrop or button underneath.
      const swallow = (clickEvent: MouseEvent) => {
        clickEvent.stopPropagation();
        clickEvent.preventDefault();
      };
      window.addEventListener('click', swallow, { capture: true, once: true });
      window.setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 400);
    };
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [open, place, close]);

  // Keep the keyboard-active option visible
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    document.getElementById(`${listId}-opt-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex, listId, pos]);

  useEffect(() => {
    const state = typeahead.current;
    return () => window.clearTimeout(state.timer);
  }, []);

  // A disabled trigger can't keep a menu open
  useEffect(() => {
    if (disabled && open) close();
  }, [disabled, open, close]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const { key } = event;

    if (!open) {
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
        event.preventDefault();
        openMenu();
      }
      return;
    }

    switch (key) {
      case 'Escape':
        // Stop it here so a modal's window-level Escape handler doesn't close the dialog too
        event.preventDefault();
        event.stopPropagation();
        close();
        return;
      case 'Tab':
        close();
        return;
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((current) => step(current, 1));
        return;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((current) => step(current, -1));
        return;
      case 'Home':
        event.preventDefault();
        setActiveIndex(firstEnabled());
        return;
      case 'End':
        event.preventDefault();
        setActiveIndex(lastEnabled());
        return;
      case 'Enter':
        event.preventDefault();
        commit(activeIndex);
        return;
      case ' ':
        if (!typeahead.current.buffer) {
          event.preventDefault();
          commit(activeIndex);
          return;
        }
        break;
    }

    // Type to jump: repeated typing extends the prefix, a pause resets it
    if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const state = typeahead.current;
      window.clearTimeout(state.timer);
      state.buffer += key.toLowerCase();
      state.timer = window.setTimeout(() => {
        state.buffer = '';
      }, TYPEAHEAD_RESET_MS);
      const start = state.buffer.length === 1 ? activeIndex : activeIndex - 1;
      for (let offset = 1; offset <= items.length; offset += 1) {
        const index = (start + offset + items.length) % items.length;
        if (!items[index].disabled && nodeText(items[index].label).toLowerCase().startsWith(state.buffer)) {
          setActiveIndex(index);
          break;
        }
      }
    }
  };

  const menu =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            data-size={size}
            data-placement={pos?.openUp ? 'top' : 'bottom'}
            // Keep focus on the trigger while the pointer works the menu
            onMouseDown={(event) => event.preventDefault()}
            className="titik-menu"
            style={{
              left: pos?.left ?? 0,
              top: pos?.top ?? (pos ? undefined : 0),
              bottom: pos?.bottom,
              minWidth: pos?.minWidth,
              maxHeight: pos?.maxHeight ?? MENU_MAX_HEIGHT,
              visibility: pos ? 'visible' : 'hidden',
            }}
          >
            {items.length === 0 && <div className="titik-option-empty">Tidak ada pilihan</div>}
            {items.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={`${item.value}-${index}`}
                  id={`${listId}-opt-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={item.disabled || undefined}
                  data-active={index === activeIndex}
                  className="titik-option"
                  onMouseMove={() => {
                    if (!item.disabled && index !== activeIndex) setActiveIndex(index);
                  }}
                  onClick={() => commit(index)}
                >
                  <span className="titik-option-label">{item.label}</span>
                  {isSelected && <Check className="titik-option-check" aria-hidden="true" />}
                </div>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        data-size={size}
        data-placeholder={isPlaceholder || undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKeyDown}
        className={`titik-select ${className}`}
      >
        <span className="titik-select-value">{triggerLabel}</span>
        <ChevronDown className="titik-select-chevron" aria-hidden="true" />
      </button>
      {menu}
    </>
  );
}
