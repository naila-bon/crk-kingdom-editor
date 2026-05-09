import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const config = defineConfig({
  theme: {
    breakpoints: {
      sm: "320px",
      md: "768px",
      lg: "960px",
      xl: "1200px",
    },
    tokens: {
      colors: {
        violet: {
          950: { value: "#1a1025" },
          900: { value: "#2d1f3d" },
          800: { value: "#120b1c" },
          700: { value: "#3d2060" },
        },
        purple: {
          400: { value: "#c084fc" },
          300: { value: "#a78bfa" },
          200: { value: "#f0abfc" },
          100: { value: "#f5d0fe" },
        },
        green: {
          300: { value: "#86efac" },
        },
        pink: {
          300: { value: "#fda4af" },
        },
        yellow: {
          200: { value: "#fde68a" },
        },
      },
    },
  },
})

export default createSystem(defaultConfig, config)