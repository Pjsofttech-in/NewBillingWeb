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
  const registerProps =
    typeof register === "function" ? register(name, rules) : {};

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
        {...registerProps}
        className={`
          w-full px-3 py-2 border rounded-md bg-white text-sm sm:text-base
          outline-none
          focus:ring-2 focus:ring-blue-500
          disabled:bg-gray-100
          disabled:cursor-not-allowed
          ${error ? "border-red-500" : "border-gray-300"}
          ${className}
        `}
      >
        <option value="" disabled>
          {placeholder}
        </option>

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