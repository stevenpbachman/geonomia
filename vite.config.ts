import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/datasette-br": {
        target: "https://nickynicolson-geonomia-br.hf.space",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/datasette-br/, ""),
      },
      "/datasette-my": {
        target: "https://nickynicolson-geonomia-my.hf.space",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/datasette-my/, ""),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
