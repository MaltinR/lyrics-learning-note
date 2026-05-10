import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type UserConfig, type ConfigEnv } from "vite";

export default defineConfig(({ command }: ConfigEnv): UserConfig => {
  // Determine if we are running a production build
  const isBuild = command === "build";

  return {
    plugins: [tailwindcss(), reactRouter()],
    resolve: {
      tsconfigPaths: true,
      alias: {
        // Only apply the Bun/React-DOM fix during the build phase
        ...(isBuild && {
          "react-dom/server": "react-dom/server.node",
        }),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
  };
});
