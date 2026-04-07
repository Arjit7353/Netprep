/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  
  darkMode: 'class',
  
  theme: {
    extend: {
      /* ====================================================================
         FONT FAMILY CONFIGURATION
         
         Define custom font stacks for different use cases:
         - sans: Default stack with Inter + Devanagari
         - inter: English-only UI elements
         - devanagari: Hindi/Devanagari text
         - numeric: Numbers with tabular-nums support
         ==================================================================== */
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'system-ui', '-apple-system', 'sans-serif'],
        inter: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        devanagari: ['Noto Sans Devanagari', 'Inter', 'system-ui', 'sans-serif'],
        numeric: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      },

      /* ====================================================================
         COLOR PALETTE EXTENSION
         
         Primary colors (Blue scale) for accent elements, buttons, links
         Secondary colors (Slate dark) for backgrounds, borders, text
         Including custom dark theme colors for cards and UI elements
         ==================================================================== */
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          750: '#283548',  /* Custom: between 700 and 800 */
          800: '#1e293b',  /* Card background */
          850: '#172032',  /* Deeper card background */
          900: '#0f172a',  /* Main background */
          950: '#0a0f1e',  /* Darkest shade */
        },
      },

      /* ====================================================================
         FONT SIZE CONFIGURATION
         
         Extended font sizes with proper line-height for typography scale
         Maintains visual hierarchy for headings and body text
         ==================================================================== */
      fontSize: {
        '2xs': ['0.625rem', '0.875rem'],
        'xs': ['0.75rem', '1rem'],
        'sm': ['0.875rem', '1.25rem'],
        'base': ['1rem', '1.5rem'],
        'lg': ['1.125rem', '1.75rem'],
        'xl': ['1.25rem', '1.75rem'],
        '2xl': ['1.5rem', '2rem'],
        '3xl': ['1.875rem', '2.25rem'],
        '4xl': ['2.25rem', '2.5rem'],
        '5xl': ['3rem', '1'],
        '6xl': ['3.75rem', '1'],
        '7xl': ['4.5rem', '1'],
        '8xl': ['6rem', '1'],
        '9xl': ['8rem', '1'],
      },

      /* ====================================================================
         LETTER SPACING CUSTOMIZATION
         
         Fine-tuned tracking values for different font sizes and contexts
         Improves readability especially for Devanagari text
         ==================================================================== */
      letterSpacing: {
        tightest: '-0.08em',
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0em',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },

      /* ====================================================================
         BORDER RADIUS CUSTOMIZATION
         
         Predefined border radius values for consistent rounded corners
         ==================================================================== */
      borderRadius: {
        '2xs': '0.25rem',
        'xs': '0.375rem',
        'sm': '0.5rem',
        'md': '0.625rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
        'full': '9999px',
      },

      /* ====================================================================
         BOX SHADOW CONFIGURATION
         
         Dark theme optimized shadows for cards, modals, and dropdowns
         Higher opacity for better contrast on dark backgrounds
         ==================================================================== */
      boxShadow: {
        'none': 'none',
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.1)',
        'base': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        
        /* Dark theme card shadows - higher opacity */
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
        'card-md': '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
        'card-lg': '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
        
        /* Modal and dropdown shadows */
        'modal': '0 25px 50px -12px rgb(0 0 0 / 0.5)',
        'dropdown': '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
        
        /* Elevation shadows for depth */
        'elevation-1': '0 1px 2px 0 rgb(0 0 0 / 0.3)',
        'elevation-2': '0 4px 6px -1px rgb(0 0 0 / 0.4)',
        'elevation-3': '0 10px 15px -3px rgb(0 0 0 / 0.4)',
        'elevation-4': '0 20px 25px -5px rgb(0 0 0 / 0.45)',
      },

      /* ====================================================================
         LINE HEIGHT CUSTOMIZATION
         
         Improved spacing for better readability with different fonts
         ==================================================================== */
      lineHeight: {
        'tight': '1.2',
        'snug': '1.375',
        'normal': '1.5',
        'relaxed': '1.625',
        'loose': '2',
      },

      /* ====================================================================
         SPACING CUSTOMIZATION
         
         Additional spacing values for padding, margin, gap
         ==================================================================== */
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      /* ====================================================================
         ANIMATION & KEYFRAMES
         
         Smooth transitions and animations for UI interactions
         ==================================================================== */
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-out': 'fadeOut 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },

      /* ====================================================================
         TRANSITION TIMING CUSTOMIZATION
         ==================================================================== */
      transitionDuration: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
        '600': '600ms',
        '700': '700ms',
        '800': '800ms',
        '900': '900ms',
        '1000': '1000ms',
      },

      /* ====================================================================
         OPACITY CUSTOMIZATION
         ==================================================================== */
      opacity: {
        '0': '0',
        '5': '0.05',
        '10': '0.1',
        '20': '0.2',
        '25': '0.25',
        '30': '0.3',
        '40': '0.4',
        '50': '0.5',
        '60': '0.6',
        '70': '0.7',
        '75': '0.75',
        '80': '0.8',
        '90': '0.9',
        '95': '0.95',
        '100': '1',
      },

      /* ====================================================================
         Z-INDEX SCALE
         
         Consistent stacking context for modals, dropdowns, sidebars, etc.
         ==================================================================== */
      zIndex: {
        'hide': '-1',
        'auto': 'auto',
        '0': '0',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
      },

      /* ====================================================================
         PSEUDO-CLASS UTILITIES
         ==================================================================== */
      screens: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        'navbar': '1200px',
      },
    },
  },

  /* =====================================================================
     PLUGINS CONFIGURATION
     
     Additional plugins for enhanced functionality
     ===================================================================== */
  plugins: [
    /* Example: Form styling plugin would go here if needed */
  ],

  /* =====================================================================
     IMPORTANT NOTES FOR DEVELOPERS
     
     1. Font Usage:
        - Use font-sans (default) for UI elements
        - Use font-inter for English-only text
        - Use font-devanagari for Hindi questions and options
        - Use font-numeric for scores, timers, marks
     
     2. Colors:
        - primary-* (blue scale): For interactive elements, links, buttons
        - secondary-* (slate dark): For backgrounds and structural elements
        - Use dark:variant for dark mode support
     
     3. Typography Classes:
        - .question-text: For Hindi questions
        - .option-text: For Hindi options
        - .font-numeric: For numbers with tabular-nums
        - .text-english: For English-only text
     
     4. Responsive Design:
        - Start with mobile-first approach
        - Use md:, lg:, xl: prefixes for larger screens
        - Test on xs (320px) for small phones
     
     5. Performance:
        - Font loading uses font-display: swap
        - No CLS (Cumulative Layout Shift) with proper font metrics
        - Use :lang(hi) for automatic Hindi font detection
     
     6. Accessibility:
        - All interactive elements have focus:ring-2 styles
        - Sufficient color contrast for WCAG AA compliance
        - Line-height > 1.5 for readability
     
     ===================================================================== */
};