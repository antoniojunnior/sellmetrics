import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tema Claro Fixo (Padrão Metrify)
        background: '#F3F4F8',
        surface: '#FFFFFF',
        border: '#E5E7EB',
        
        text: {
          primary: '#111827',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
        
        accent: {
          DEFAULT: '#7B5CF0',
          light: '#EDE9FE',
          hover: '#6D4FD8',
        },
        
        positive: {
          DEFAULT: '#22C55E',
          light: '#DCFCE7',
        },
        
        negative: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
        },
        
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
        },
        
        info: {
          DEFAULT: '#3B82F6',
          light: '#DBEAFE',
        },
      },
      fontSize: {
        'xs': ['11px', '16px'],
        'sm': ['13px', '20px'],
        'base': ['15px', '24px'],
        'lg': ['18px', '28px'],
        'xl': ['22px', '32px'],
        '2xl': ['28px', '38px'],
        '3xl': ['36px', '48px'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      borderRadius: {
        'xl': '12px',
        'lg': '8px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.10)',
      },
    },
  },
  plugins: [],
}

export default config
