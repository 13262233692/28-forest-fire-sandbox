import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-reconciler', 'scheduler'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@react-three/fiber',
      '@react-three/drei',
      'three',
      'zustand',
    ],
  },
  plugins: [
    react(),
    tsconfigPaths()
  ],
})
