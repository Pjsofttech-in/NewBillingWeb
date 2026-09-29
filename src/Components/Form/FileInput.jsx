const FileInput = ({label, name, register, rules = {}, error}) => {
  return (
    <div>
      <label className="block mb-1 text-xs sm:text-sm font-medium text-slate-700">{label}</label>

      <input
        type="file"
        {...register(name, rules)}
        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      {error && <p className="text-red-500 text-xs sm:text-sm mt-1">{error.message}</p>}
    </div>
  );
};

export default FileInput;
