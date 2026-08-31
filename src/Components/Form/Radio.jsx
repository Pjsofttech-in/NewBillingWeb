const Radio = ({
  label,
  name,
  options = [],
  register,
  rules = {},
  error,
  required = false,
  disabled = false,
  className = "",
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <p className="text-sm font-medium mb-2 text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </p>
      )}

      <div className="flex flex-wrap gap-3 sm:gap-5">
        {options.map((item) => (
          <label
            key={item.value}
            className={`flex items-center gap-2 text-sm sm:text-base ${
              disabled || item.disabled
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer"
            }`}
          >
            <input
              type="radio"
              value={item.value}
              disabled={disabled || item.disabled}
              {...register(name, rules)}
              className="cursor-pointer"
            />

            {item.label}
          </label>
        ))}
      </div>

      {error && (
        <p className="text-red-500 text-xs sm:text-sm mt-1">
          {error.message}
        </p>
      )}
    </div>
  );
};

export default Radio;