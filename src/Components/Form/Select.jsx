/*
 * Reusable dropdown.
 *  - react-hook-form:  <Select name="x" register={register} rules={...} options={...} />
 *  - plain state:      <Select value={v} onChange={(e) => setV(e.target.value)} options={...} />
 *    (add showPlaceholder={false} when the dropdown always has a value, e.g. Paid / Pending)
 */
const Select = ({
  label,
  name,
  id,
  options = [],
  register,
  rules = {},
  error,
  required = false,
  disabled = false,
  placeholder = "Select",
  allowEmpty = false,
  showPlaceholder = true,
  value,
  onChange,
  className = "",
}) => {
  const registerProps =
    typeof register === "function" ? register(name, rules) : {};
  const controlled = value !== undefined;
  const selectId = id || name;

  // controlled: value + onChange | react-hook-form: registerProps | otherwise: uncontrolled with an optional onChange
  const valueProps = controlled
    ? {value, onChange}
    : {defaultValue: "", ...registerProps, ...(onChange ? {onChange} : {})};

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block mb-1 text-xs sm:text-sm font-medium text-slate-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <select
        id={selectId}
        disabled={disabled}
        {...valueProps}
        className={`
          w-full px-3 py-2 border rounded-md bg-white text-sm sm:text-base
          outline-none
          focus:ring-2 focus:ring-blue-500
          disabled:bg-slate-100
          disabled:cursor-not-allowed
          ${error ? "border-red-500" : "border-slate-300"}
          ${className}
        `}
      >
        {showPlaceholder && (
          <option value="" disabled={!allowEmpty}>
            {placeholder}
          </option>
        )}

        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            disabled={opt.disabled}
          >
            {opt.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="text-xs sm:text-sm text-red-500 mt-1">
          {error.message}
        </p>
      )}
    </div>
  );
};

export default Select;
