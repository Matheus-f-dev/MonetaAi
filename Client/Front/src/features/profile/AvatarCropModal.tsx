import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Button, Modal } from '../../design-system';
import styles from './AvatarCropModal.module.css';

const PREVIEW_SIZE = 240;
const OUTPUT_SIZE = 480;
const MIN_SCALE = 1;
const MAX_SCALE = 3;

export interface AvatarCropModalProps {
  open: boolean;
  file: File | null;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

/**
 * Pedido do usuário: "deixa eu arrumar a foto, e centralizar do jeito
 * que eu quero" -- antes a foto escolhida ia direto como avatar, sem
 * nenhum jeito de reenquadrar. Arrasta pra reposicionar + slider de
 * zoom, tudo client-side (canvas), sem biblioteca nova. O recorte final
 * sai sempre quadrado (480x480) -- o círculo é só a máscara CSS que o
 * resto do app já usa pra exibir avatar (Topbar, aqui mesmo), não faz
 * sentido recortar em círculo de verdade e perder os cantos à toa.
 */
export function AvatarCropModal({ open, file, onCancel, onConfirm }: AvatarCropModalProps) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(MIN_SCALE);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!file) {
      setImgUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    setScale(MIN_SCALE);
    setOffset({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const displayedSize = useMemo(() => {
    if (!naturalSize.w || !naturalSize.h) return { w: 0, h: 0 };
    const baseScale = PREVIEW_SIZE / Math.min(naturalSize.w, naturalSize.h);
    const effectiveScale = baseScale * scale;
    return { w: naturalSize.w * effectiveScale, h: naturalSize.h * effectiveScale };
  }, [naturalSize, scale]);

  function clampOffset(next: { x: number; y: number }, size = displayedSize) {
    const maxX = Math.max(0, (size.w - PREVIEW_SIZE) / 2);
    const maxY = Math.max(0, (size.h - PREVIEW_SIZE) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y))
    };
  }

  function handleImageLoad() {
    const img = imgRef.current;
    if (!img) return;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, offsetX: offset.x, offsetY: offset.y };
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset(clampOffset({ x: dragRef.current.offsetX + dx, y: dragRef.current.offsetY + dy }));
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    dragRef.current = null;
  }

  function handleScaleChange(nextScale: number) {
    setScale(nextScale);
    const baseScale = PREVIEW_SIZE / Math.min(naturalSize.w || 1, naturalSize.h || 1);
    const nextDisplayed = { w: naturalSize.w * baseScale * nextScale, h: naturalSize.h * baseScale * nextScale };
    setOffset((prev) => clampOffset(prev, nextDisplayed));
  }

  function handleReset() {
    setScale(MIN_SCALE);
    setOffset({ x: 0, y: 0 });
  }

  function handleConfirm() {
    const img = imgRef.current;
    if (!img || !naturalSize.w) return;

    const baseScale = PREVIEW_SIZE / Math.min(naturalSize.w, naturalSize.h);
    const effectiveScale = baseScale * scale;
    const displayedW = naturalSize.w * effectiveScale;
    const displayedH = naturalSize.h * effectiveScale;
    const imgLeft = (PREVIEW_SIZE - displayedW) / 2 + offset.x;
    const imgTop = (PREVIEW_SIZE - displayedH) / 2 + offset.y;

    const sx = -imgLeft / effectiveScale;
    const sy = -imgTop / effectiveScale;
    const sSize = PREVIEW_SIZE / effectiveScale;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onConfirm(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.9
    );
  }

  return (
    <Modal open={open} onClose={onCancel} title="Ajustar foto">
      <div className={styles.body}>
        <div
          className={styles.frame}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {imgUrl && (
            <img
              ref={imgRef}
              src={imgUrl}
              alt=""
              draggable={false}
              onLoad={handleImageLoad}
              className={styles.image}
              style={{
                width: displayedSize.w,
                height: displayedSize.h,
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`
              }}
            />
          )}
        </div>

        <p className={styles.hint}>Arraste pra reposicionar, use o controle abaixo pra aproximar.</p>

        <div className={styles.zoomRow}>
          <span className={styles.zoomLabel} aria-hidden="true">
            −
          </span>
          <input
            type="range"
            min={MIN_SCALE}
            max={MAX_SCALE}
            step={0.01}
            value={scale}
            onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
            className={styles.zoomSlider}
            aria-label="Zoom da foto"
          />
          <span className={styles.zoomLabel} aria-hidden="true">
            +
          </span>
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            Recentralizar
          </Button>
          <div className={styles.actionsRight}>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirm}>
              Usar esta foto
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
