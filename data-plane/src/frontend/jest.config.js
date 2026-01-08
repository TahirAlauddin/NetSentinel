const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.ts and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  coverageProvider: "v8",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: [
    "**/tests/**/*.test.[jt]s?(x)",
    "**/tests/**/*.spec.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)"
  ],
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/e2e/",
    "<rootDir>/tests/__utils__/",
    "<rootDir>/tests/__mocks__/",
    "<rootDir>/tests/__fixtures__/",
  ],
  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/coverage/**",
    "!**/*.config.{js,ts}",
    "!**/jest.setup.js",
    "!**/tests/**",
    "!**/__mocks__/**",
    "!**/__fixtures__/**",
    "!**/__utils__/**",
    // Exclude type definition files
    "!**/types/**",
    // Exclude hooks from coverage
    "!**/hooks/**",
    "!**/*hooks*.ts",
    "!**/*hooks*.tsx",
    // Exclude shadcn UI components (already tested by shadcn)
    "!**/components/ui/dialog.tsx",
    "!**/components/ui/dropdown-menu.tsx",
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  moduleDirectories: ["node_modules", "<rootDir>"],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
