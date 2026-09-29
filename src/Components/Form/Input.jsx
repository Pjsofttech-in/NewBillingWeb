const Input = ({
  label,
  name,
  type = "text",
  placeholder = "",
  register,
  rules = {},
  error,
  required = false,
  disabled = false,
  className = "",
}) => {
  const registerProps =
    typeof register === "function" ? register(name, rules) : {};

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="block mb-1 text-xs sm:text-sm font-medium text-slate-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        {...registerProps}
        className={`
          w-full px-3 py-2 border rounded-md text-sm sm:text-base
          outline-none
          focus:ring-2 focus:ring-blue-500
          disabled:bg-slate-100
          disabled:cursor-not-allowed
          ${error ? "border-red-500" : "border-slate-300"}
          ${className}
        `}
      />

      {error && (
        <p className="text-xs sm:text-sm text-red-500 mt-1">
          {error.message}
        </p>
      )}
    </div>
  );
};

export default Input;