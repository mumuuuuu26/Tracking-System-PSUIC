module.exports = {
  testEnvironment: "node",
  transformIgnorePatterns: [
    "node_modules/(?!(uuid)/)"
  ],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testPathIgnorePatterns: ["/node_modules/", "/client/", "/e2e/"]
};
