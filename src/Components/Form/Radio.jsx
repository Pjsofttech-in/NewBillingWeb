const Radio = ({label, name, options, register, rules = {}, error}) => {
  return (
    <div>
      <p className="text-sm font-medium mb-2">{label}</p>

      <div className="flex flex-wrap gap-3 sm:gap-5">
        {options.map((item) => (
          <label
            key={item.value}
            className="flex items-center gap-2 text-sm sm:text-base cursor-pointer"
          >
            <input
              type="radio"
              value={item.value}
              {...register(name, rules)}
              className="cursor-pointer"
            />

            {item.label}
          </label>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
    </div>
  );
};

export default Radio;
