
const Checkbox = ({
  label,
  name,
  register,
  rules = {},
  error,
  disabled = false,
  ...rest
}) => {
  return (
    <div className="flex flex-col justify-center">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer select-none">
        <input
          type="checkbox"
          {...register(name, rules)}
          disabled={disabled}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
          {...rest}
        />
        <span>{label}</span>
      </label>

      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
    </div>
  );
};

export default Checkbox;
