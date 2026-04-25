import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  build: {
    chunkSizeWarningLimit: 1500, // pdfjs core is ~1.2MB and lives behind a lazy route
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router')) return 'vendor-router';
            if (id.includes('/react/') || id.includes('/react-dom/')) return 'vendor-react';
            // Worker module is emitted as its own chunk via `?worker`; never
            // fold it into vendor-pdfjs even if the matcher otherwise would.
            if (id.includes('pdfjs-dist') && !id.includes('worker')) return 'vendor-pdfjs';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('papaparse')) return 'vendor-papaparse';
          }
        },
      },
    },
  },
});
