import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";
import { fileURLToPath } from "url";

// Fix for "__dirname is not defined" in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  resolve: {
    alias: {
      // This line forces any import starting with "~/constants" to look in your root folder
      "~/constants": path.resolve(__dirname, "./constants"),
    },
  },
  // 👇 ADD THIS BLOCK TO FIX THE CRASH
  define: {
    'process.env': {},       // Stubs process.env so libs don't crash
    'process.title': '"browser"', // Stubs process.title specifically (fixes your error)
    'process.version': '""', // Stubs version just in case
  },
});
