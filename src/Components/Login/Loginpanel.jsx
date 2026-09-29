import {useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {
  Mail,
  Lock,
  User,
  GitBranch,
  LayoutGrid,
  Eye,
  EyeOff,
} from "lucide-react";
import Input from "../Form/Input";

const iconMap = {
  mail: Mail,
  lock: Lock,
  user: User,
  branch: GitBranch,
  grid: LayoutGrid,
};

const topBarStyles = {
  superAdmin: {
    gradient: "from-amber-500 via-amber-400/40 to-transparent",
    shadow: "drop-shadow-[0_6px_12px_rgba(217,119,6,0.85)]",
  },
  branch: {
    gradient: "from-emerald-500 via-emerald-400/40 to-transparent",
    shadow: "drop-shadow-[0_6px_12px_rgba(5,150,105,0.85)]",
  },
  department: {
    gradient: "from-blue-600 via-blue-400/40 to-transparent",
    shadow: "drop-shadow-[0_6px_12px_rgba(67,56,202,0.85)]",
  },
  staff: {
    gradient: "from-red-500 via-red-400/40 to-transparent",
    shadow: "drop-shadow-[0_6px_12px_rgba(220,38,38,0.85)]",
  },
};

function Field({field, showPassword, onTogglePassword, register, errors}) {
  const Icon = iconMap[field.icon] ?? User;
  const isPassword = field.type === "password";

  return (
    <div className="relative w-full">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 stroke-2 z-10" />

      <Input
        name={field.name || field.id}
        type={isPassword && showPassword ? "text" : field.type}
        placeholder={field.label}
        register={register}
        rules={field.rules || {required: `${field.label} is required`}}
        error={errors?.[field.name || field.id]}
        className={`w-full rounded-xl border-slate-200 bg-white py-3.5 pl-11 ${
          isPassword ? "pr-10" : "pr-4"
        } text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none transition-all focus:border-amber-600 focus:ring-1 focus:ring-amber-600`}
      />

      {isPassword && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-10"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 stroke-2" />
          ) : (
            <Eye className="h-4 w-4 stroke-2" />
          )}
        </button>
      )}
    </div>
  );
}

const variants = {
  initial: {opacity: 0, y: 18, filter: "blur(4px)"},
  animate: {opacity: 1, y: 0, filter: "blur(0px)"},
  exit: {opacity: 0, y: -12, filter: "blur(2px)"},
};

export default function LoginPanel({tab, register, errors, onSubmit}) {
  const [showPassword, setShowPassword] = useState(false);
  const activeStyle = topBarStyles[tab.id] || topBarStyles.superAdmin;

  return (
    <div className="relative w-full max-w-md">
      <div className="relative min-h-95 w-full pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab.id}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="w-full"
          >
            <div
              className={`absolute -top-10 left-0 right-0 h-1 bg-gradient-to-r ${activeStyle.gradient} ${activeStyle.shadow}`}
            />

            <h1 className="text-2xl font-black text-slate-800 tracking-tight py-2">
              {tab.title}
            </h1>
            <p className="mt-1.5 text-sm font-semibold text-slate-400">
              {tab.subtitle}
            </p>

            <form
              className="mt-6 space-y-4 w-full"
              onSubmit={onSubmit}
            >
              {tab.fields.map((field) => (
                <Field
                  key={field.id}
                  field={field}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword((s) => !s)}
                  register={register}
                  errors={errors}
                />
              ))}

              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-amber-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:bg-amber-700 active:scale-[0.98] cursor-pointer"
              >
                Sign In
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between text-xs font-semibold">
              <a
                href="#forgot"
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                Forgot Password?
              </a>
              {tab.id === "superAdmin" && (
                <a
                  href="#create"
                  className="text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Create Account
                </a>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
