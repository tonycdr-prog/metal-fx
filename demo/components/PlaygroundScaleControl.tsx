export function PlaygroundScaleControl({ scale, onChange }: { scale: number; onChange: (scale: number) => void }) {
  return (
    <label className="flex flex-col gap-[9px] min-w-[100px] w-[140px] max-sm:w-full">
      <span className="text-xs font-normal leading-[14px] text-(--text-muted)">Scale</span>
      <input
        className="h-9 w-full accent-(--strength-fill-bg)"
        type="range"
        min={0.5}
        max={2}
        step={0.5}
        value={scale}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label="Effect scale"
      />
    </label>
  );
}
