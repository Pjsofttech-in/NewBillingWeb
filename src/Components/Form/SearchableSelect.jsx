import {useState, useRef, useEffect} from "react";

const SearchableSelect = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = "Select...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value),
  );

  const filteredOptions = options.filter((opt) =>
    opt.label?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="relative w-full"
      ref={dropdownRef}
    >
      {label && (
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          {label}
        </label>
      )}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm cursor-pointer flex justify-between items-center focus:ring-2 focus:ring-blue-500"
      >
        <span
          className={
            selectedOption ? "text-gray-900 font-medium" : "text-gray-400"
          }
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="text-xs text-gray-400">▼</span>
      </div>

      {isOpen && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto p-1">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-2.5 py-1.5 mb-1 border border-gray-200 rounded text-xs outline-none focus:border-blue-500"
            autoFocus
          />

          <div
            onClick={() => {
              onChange("");
              setIsOpen(false);
              setSearchTerm("");
            }}
            className="px-3 py-1.5 text-xs text-red-600 font-medium hover:bg-red-50 rounded cursor-pointer"
          >
            Clear Selection
          </div>

          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                className={`px-3 py-2 text-xs rounded cursor-pointer transition ${
                  String(value) === String(opt.value)
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-gray-400 text-center">
              No options found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
