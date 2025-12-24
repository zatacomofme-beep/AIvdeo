/** @type {import('tailwindcss').Config} */
// 商务科技风配置 - Business Tech Style (参考 Linear, Vercel)
export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
    theme: {
        extend: {
            colors: {
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                
                // --- Business Tech Palette ---
                // 主品牌色 (深邃权威)
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                    900: '#0f172a', // Slate 900
                    800: '#1e293b',
                },
                // 科技点缀色 (电光蓝 - 活跃/AI)
                tech: {
                    DEFAULT: '#0ea5e9', // Sky 500
                    hover: '#0284c7',   // Sky 600
                    light: '#e0f2fe',   // Sky 100 (背景)
                    dark: '#075985',    // Sky 800
                },
                // 中性灰 (构建骨架)
                slate: {
                    50: '#f8fafc',  // 页面背景
                    100: '#f1f5f9', // 面板背景
                    200: '#e2e8f0', // 边框
                    300: '#cbd5e1', // 分割线
                    400: '#94a3b8', // 占位文字
                    500: '#64748b', // 次要文字
                    600: '#475569', // 正常文字
                    700: '#334155', // 强调文字
                    800: '#1e293b', // 深色背景
                    900: '#0f172a', // 主要文字/深色面板
                    950: '#020617', // 最深背景
                },
                
                // 保留 shadcn 语义变量映射
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
            },
            borderRadius: {
                // 商务风更锐利，减小圆角
                lg: '0.5rem',    // 8px
                md: '0.375rem',  // 6px
                sm: '0.25rem'    // 4px
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'SF Mono', 'Consolas', 'monospace'],
            },
            boxShadow: {
                // 精致的层级投影
                'tech-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'tech-md': '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -1px rgba(15, 23, 42, 0.06)',
                'tech-lg': '0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
                'tech-glow': '0 0 15px rgba(14, 165, 233, 0.3)', // 蓝色科技光晕
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'pulse-tech': 'pulseTech 2s infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                pulseTech: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.5' },
                }
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
}
