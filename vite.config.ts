import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild', // Es mucho más rápido que terser
    sourcemap: false,
    reportCompressedSize: false, // Ganamos segundos al no calcular tamaños
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        manualChunks: undefined, // A veces intentar separarlos consume más memoria, vamos a dejar que lo haga todo junto si prefiere
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'], // Forzamos esto para que no lo analice en el build
  }
}); 
