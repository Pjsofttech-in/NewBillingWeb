import Input from "./Input";
import Select from "./Select";
import Radio from "./Radio";
import FileInput from "./FileInput";
import PhotoUpload from "./PhotoUpload";

const FieldRenderer = ({field, register, errors}) => {
  const {type, name, label, required, options = [], rules = {}} = field;
  const error = errors?.[name];
  const placeholder = `${label}${required ? " *" : ""}`;
  const mergedRules = {
    ...(required ? {required: `${label} is required`} : {}),
    ...rules,
  };

  switch (type) {
    case "select":
      return (
        <Select
          name={name}
          placeholder={placeholder}
          options={options}
          register={register}
          rules={mergedRules}
          error={error}
        />
      );

    case "radio":
      return (
        <Radio
          label={label}
          name={name}
          options={options}
          register={register}
          rules={mergedRules}
          error={error}
        />
      );

    case "file":
      return (
        <FileInput
          label={placeholder}
          name={name}
          register={register}
          rules={mergedRules}
          error={error}
        />
      );

    case "photo":
      return (
        <PhotoUpload
          name={name}
          label={placeholder}
          register={register}
          rules={mergedRules}
          error={error}
        />
      );

    case "textarea":
      return (
        <div className="w-full">
          <textarea
            placeholder={placeholder}
            rows={3}
            {...register(name, mergedRules)}
            className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 sm:text-base ${
              error ? "border-red-500" : "border-gray-300"
            }`}
          />
          {error && (
            <p className="mt-1 text-xs text-red-500 sm:text-sm">
              {error.message}
            </p>
          )}
        </div>
      );

    default:
      // text, email, password, tel, number, date, etc.
      return (
        <Input
          name={name}
          type={type}
          placeholder={placeholder}
          register={register}
          rules={mergedRules}
          error={error}
        />
      );
  }
};

export default FieldRenderer;
