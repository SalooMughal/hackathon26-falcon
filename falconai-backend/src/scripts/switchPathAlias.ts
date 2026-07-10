import path from "path";
import fs from "fs";

// Read package.json
const packageJsonPath = path.join(__dirname, "../../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

// Update _moduleAliases for production
packageJson._moduleAliases = {
  "@app": "./dist",
};

// Write the updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log("Updated _moduleAliases in package.json:", packageJson._moduleAliases);
