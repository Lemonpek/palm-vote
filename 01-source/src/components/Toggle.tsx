type ToggleProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function Toggle({ label, checked, onChange, disabled = false }: ToggleProps) {
  return (
    <label className={`toggle-control${disabled ? ' is-disabled' : ''}`}>
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="toggle-control__track" aria-hidden="true"><span /></span>
    </label>
  );
}
