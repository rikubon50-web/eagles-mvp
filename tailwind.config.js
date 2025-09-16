// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef6f2",
          100: "#d6eae0",
          200: "#afd6c1",
          300: "#83bf9d",
          400: "#54a77a",
          500: "#2f8f5f",  // メイングリーン
          600: "#23724b",
          700: "#1d5b3d",
          800: "#164631",
          900: "#0e2c1f"
        },
        navy: "#0f172a" // 見出し/ヘッダー用
      },
      boxShadow: {
        card: "0 6px 20px -8px rgba(2,6,23,0.15)"
      },
      borderRadius: {
        xl2: "1.25rem"
      },
      keyframes: {
        shine: {
          '0%':   { transform: 'translateX(-80%) skewX(-25deg)', opacity: '0' },
          '30%':  { opacity: '0.9' },
          '60%':  { opacity: '0.9' },
          '100%': { transform: 'translateX(180%) skewX(-25deg)', opacity: '0' },
        },
      },
      animation: {
        shine: 'shine 0.25s ease-out both',
      },
    },
  },
  plugins: [],
};