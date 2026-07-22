import fs from "node:fs";
import path from "node:path";

const outputDirectory = path.resolve(process.argv[2] || "out");
const origin = "https://static.invalid";

const walk = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : entryPath;
  });

const htmlFiles = walk(outputDirectory).filter((file) =>
  file.endsWith(".html")
);
const failures = new Map();

const routeForHtmlFile = (file) => {
  const relativePath = path
    .relative(outputDirectory, file)
    .replaceAll("\\", "/");
  if (relativePath === "index.html") return "/";
  if (relativePath.endsWith("/index.html")) {
    return `/${relativePath.slice(0, -"index.html".length)}`;
  }
  return `/${relativePath}`;
};

const routeExists = (pathname) => {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return false;
  }

  const relativePath = decodedPath.replace(/^\/+/, "");
  const candidates = [
    path.join(outputDirectory, relativePath),
    path.join(outputDirectory, relativePath, "index.html"),
    path.join(outputDirectory, `${relativePath}.html`),
  ];
  return candidates.some((candidate) => {
    try {
      return fs.statSync(candidate).isFile();
    } catch {
      return false;
    }
  });
};

for (const htmlFile of htmlFiles) {
  const sourceRoute = routeForHtmlFile(htmlFile);
  const html = fs.readFileSync(htmlFile, "utf8");
  const hrefPattern = /<a\b[^>]*\bhref=["']([^"']+)["']/gi;

  for (const match of html.matchAll(hrefPattern)) {
    const href = match[1];
    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    ) {
      continue;
    }

    const target = new URL(href, new URL(sourceRoute, origin));
    if (target.origin !== origin || routeExists(target.pathname)) continue;

    const sources = failures.get(target.pathname) || new Set();
    sources.add(sourceRoute);
    failures.set(target.pathname, sources);
  }
}

if (failures.size > 0) {
  for (const [target, sources] of [...failures].sort()) {
    process.stderr.write(
      `Broken internal link: ${target} (from ${[...sources].sort().join(", ")})\n`
    );
  }
  process.exit(1);
}

process.stdout.write(
  `Static link check passed: ${htmlFiles.length} HTML files checked.\n`
);
