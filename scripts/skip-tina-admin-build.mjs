import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const cliPath = require.resolve("@tinacms/cli");
const source = fs.readFileSync(cliPath, "utf8");
const buildCall =
  "    await buildProductionSpa(configManager, database, codegen2.productionUrl);";
const guardedBuildCall =
  '    if (process.env.TINA_SKIP_ADMIN_BUILD !== "true") { await buildProductionSpa(configManager, database, codegen2.productionUrl); }';

if (!source.includes(buildCall) && !source.includes(guardedBuildCall)) {
  throw new Error("Unable to locate the Tina admin build call");
}

if (source.includes(buildCall)) {
  fs.writeFileSync(cliPath, source.replace(buildCall, guardedBuildCall));
}

const schemaSourceDirectory = path.resolve("content/apiSchema");
const schemaOutputDirectory = path.resolve("public/api-schemas");
fs.mkdirSync(schemaOutputDirectory, { recursive: true });

for (const filename of fs.readdirSync(schemaSourceDirectory)) {
  if (!filename.endsWith(".json")) continue;

  const tinaDocument = JSON.parse(
    fs.readFileSync(path.join(schemaSourceDirectory, filename), "utf8")
  );
  const schema = JSON.parse(tinaDocument.apiSchema);
  fs.writeFileSync(
    path.join(schemaOutputDirectory, filename),
    `${JSON.stringify(schema)}\n`
  );
}
