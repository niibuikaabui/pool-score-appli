/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 落ち着いたパレット（テラコッタ・セージ・オーカーなど）
        player: {
          0: { bg: '#c0392b', text: '#fff', light: '#e74c3c' }, // テラコッタ
          1: { bg: '#27ae60', text: '#fff', light: '#2ecc71' }, // セージ
          2: { bg: '#d4a017', text: '#fff', light: '#f1c40f' }, // オーカー
          3: { bg: '#2980b9', text: '#fff', light: '#3498db' }, // スレートブルー
          4: { bg: '#8e44ad', text: '#fff', light: '#9b59b6' }, // パープル
          5: { bg: '#16a085', text: '#fff', light: '#1abc9c' }, // ティール
        },
      },
    },
  },
  plugins: [],
}
