import { useEffect, useRef, type ReactNode } from 'react';
import { X, Star } from 'lucide-react';
export function Badge({
  children,
  tone = ''
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Rating({
  value
}: {
  value: number;
}) {
  return <span className="rating" aria-label={`${value} out of 5`}>{Array.from({
      length: 5
    }, (_, i) => <Star key={i} size={11} fill={i < value ? 'currentColor' : 'none'} className={i < value ? '' : 'empty'} />)}</span>;
}
export function Modal({
  title,
  children,
  close
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (!dialog.current?.contains(document.activeElement)) dialog.current?.querySelector<HTMLElement>('input,textarea,select,button')?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <div className="modal-backdrop" onMouseDown={e => {
    if (e.target === e.currentTarget) close();
  }}><section ref={dialog} className="modal" role="dialog" aria-modal="true" aria-label={title} onKeyDown={e => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        const items = e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]');
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }}><div className="modal-title"><h2>{title}</h2><button aria-label="Close dialog" className="icon-button" onClick={close}><X size={20} /></button></div>{children}</section></div>;
}
export function Empty({
  children
}: {
  children: ReactNode;
}) {
  return <div className="empty-state">{children}</div>;
}
export function Field({
  label,
  children,
  wide = false
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return <label className={wide ? 'field wide' : 'field'}><span>{label}</span>{children}</label>;
}
