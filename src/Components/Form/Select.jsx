// Components/Form/Select.jsx
const Select = ({
  label,
  name,
  options = [],
  register,
  rules = {},
  error,

  required = false,
  disabled = false,
  placeholder = "Select",
  className = "",
}) => {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="block mb-1 text-xs sm:text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <select
        id={name}
        disabled={disabled}
        defaultValue=""
        {...register(name, rules)}
        className={`
          w-full px-3 py-2 border rounded-md bg-white text-sm sm:text-base
          outline-none
          focus:ring-2 focus:ring-blue-500
          disabled:bg-gray-100
          ${error ? "border-red-500" : "border-gray-300"}
          ${className}
        `}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && <p className="text-xs sm:text-sm text-red-500 mt-1">{error.message}</p>}
    </div>
  );
};

export default Select;