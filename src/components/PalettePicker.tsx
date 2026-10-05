export type Palette = 'forest' | 'ocean';

export function PalettePicker({palette,onChange}:{palette:Palette;onChange:(palette:Palette)=>void}) {
  return (
    <div className="palette-picker">
      <span className="palette-label">Color theme</span>
      <div className="palette-options" role="group" aria-label="Color theme">
        {(['forest','ocean'] as const).map(option => (
          <button key={option} type="button" aria-pressed={palette === option} onClick={() => onChange(option)}>
            <span className={`palette-swatch ${option}`} aria-hidden="true" />
            {option === 'forest' ? 'Forest' : 'Ocean'}
          </button>
        ))}
      </div>
    </div>
  );
}
