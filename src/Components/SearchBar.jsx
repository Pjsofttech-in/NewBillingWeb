import {useEffect, useRef, useState} from "react";
import {Search, XCircle} from "lucide-react";

const SIZES = {
  // same look as Components/Form/Input + Select
  form: "py-2 text-sm sm:text-base",
  md: "h-9 text-sm",
  sm: "py-1.5 text-xs",
};

/**
 * Reusable search box.
 *
 * - Keeps what the user types locally and calls `onChange(text)` after they pause
 *   typing (`debounceMs`), so a server-side search is not hit on every keystroke.
 *   Use `debounceMs={0}` when the list is filtered in the browser.
 * - Enter applies immediately; the X button clears immediately.
 * - If the parent changes `value` (e.g. a "Clear filters" button) the box follows.
 */
const SearchBar = ({
  value = "",
  onChange,
  placeholder = "Search...",
  debounceMs = 350,
  size = "form",
  ariaLabel = "Search",
  className = "",
}) => {
  const [text, setText] = useState(value);

  const onChangeRef = useRef(onChange);
  const lastSent = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Parent changed the value from outside -> mirror it.
  useEffect(() => {
    if (value !== lastSent.current) {
      lastSent.current = value;
      setText(value);
    }
  }, [value]);

  // User typed -> tell the parent once they pause.
  useEffect(() => {
    if (text === lastSent.current) return undefined;

    const timer = setTimeout(() => {
      lastSent.current = text;
      onChangeRef.current?.(text);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [text, debounceMs]);

  const sendNow = (next) => {
    lastSent.current = next;
    onChangeRef.current?.(next);
  };

  return (
    <div className={`relative w-full ${className}`}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />

      <input
        type="text"
        value={text}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            sendNow(text);
          }
        }}
        className={`w-full rounded-md border border-slate-300 bg-white pl-9 pr-9 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 ${
          SIZES[size] || SIZES.form
        }`}
      />

      {text && (
        <button
          type="button"
          onClick={() => {
            setText("");
            sendNow("");
          }}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-700"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
