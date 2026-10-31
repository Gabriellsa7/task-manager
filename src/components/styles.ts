const buttonBase =
  "inline-flex items-center justify-center rounded-md border px-3.5 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export const button = {
  default: `${buttonBase} border-gray-300 bg-white text-gray-900 enabled:hover:bg-gray-50`,
  primary: `${buttonBase} border-blue-600 bg-blue-600 text-white enabled:hover:bg-blue-700`,
  danger: `${buttonBase} border-gray-300 bg-white text-red-600 enabled:hover:bg-red-50`,
};

export const card = "rounded-lg border border-gray-300 bg-white p-4";
