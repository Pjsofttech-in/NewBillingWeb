const PhotoUpload = ({name, label, register, rules, error}) => {
  return (
    <div className="w-full">
      <label
        htmlFor={name}
        className="flex h-[92px] w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-2 text-center text-xs font-medium text-slate-500 hover:bg-slate-100"
      >
        {label}
      </label>
      <input
        id={name}
        type="file"
        accept="image/*"
        {...register(name, rules)}
        className="hidden"
      />
      {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
    </div>
  );
};

export default PhotoUpload;
