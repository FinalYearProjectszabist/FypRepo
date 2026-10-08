export default function FormField({ label, name, error, hint, as = 'input', children, ...props }) {
  const Tag = as;
  return (
    <div>
      {label && <label htmlFor={name} className="label">{label}</label>}
      {children || (
        <Tag
          id={name}
          name={name}
          className={`input ${error ? 'input-error' : ''}`}
          aria-invalid={!!error}
          {...props}
        />
      )}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
