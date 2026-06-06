import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Expose both VITE_* vars and the SUPABASE_ANON_KEY var to client code.
export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'SUPABASE_ANON_KEY'],
})
