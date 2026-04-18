import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (process.platform !== 'win32') {
  process.exit(0);
}

const require = createRequire(import.meta.url);
const granitePackageJsonPath = require.resolve('@granite-js/plugin-micro-frontend/package.json', {
  paths: [join(__dirname, '..')],
});
const granitePackageDir = dirname(granitePackageJsonPath);
const pluginsPackageJsonPath = require.resolve('@apps-in-toss/plugins/package.json', {
  paths: [join(__dirname, '..')],
});
const pluginsPackageDir = dirname(pluginsPackageJsonPath);
const graniteReactNativePackageJsonPath = require.resolve('@granite-js/react-native/package.json', {
  paths: [join(__dirname, '..')],
});
const graniteReactNativePackageDir = dirname(graniteReactNativePackageJsonPath);
const graniteRouterPackageJsonPath = require.resolve('@granite-js/plugin-router/package.json', {
  paths: [join(__dirname, '..')],
});
const graniteRouterPackageDir = dirname(graniteRouterPackageJsonPath);
const workspaceRoot = join(__dirname, '..', '..', '..');
const pnpmRoot = join(workspaceRoot, 'node_modules', '.pnpm');
const bedrockRouteGeneratorStoreDir = readdirSync(pnpmRoot).find((entry) => entry.startsWith('@react-native-bedrock+route_'));
const bedrockRouteGeneratorPackageDir =
  bedrockRouteGeneratorStoreDir == null
    ? null
    : join(pnpmRoot, bedrockRouteGeneratorStoreDir, 'node_modules', '@react-native-bedrock', 'route-generator');
const mpackNextStoreDir = readdirSync(pnpmRoot).find((entry) => entry.startsWith('@react-native-bedrock+mpack-next@'));
const mpackNextPackageDir =
  mpackNextStoreDir == null ? null : join(pnpmRoot, mpackNextStoreDir, 'node_modules', '@react-native-bedrock', 'mpack-next');
const targetFiles = [
  {
    label: 'Granite micro-frontend',
    files: [join(granitePackageDir, 'dist', 'index.js'), join(granitePackageDir, 'dist', 'index.cjs')],
    replacements: [
      {
        search: "path.resolve(modulePath)",
        replace: "path.resolve(modulePath).replace(/\\\\/g, '/')",
      },
      {
        search: "path.default.resolve(modulePath)",
        replace: "path.default.resolve(modulePath).replace(/\\\\/g, '/')",
      },
    ],
  },
  {
    label: 'Apps In Toss shared registry',
    files: [join(pluginsPackageDir, 'dist', 'index.js'), join(pluginsPackageDir, 'dist', 'index.cjs')],
    replacements: [
      {
        search: `shared: getSharedPackages({
        reactNativeVersion
      }),`,
        replace: `shared: getSharedPackages({
        reactNativeVersion
      }).reduce((prev, curr) => ({
        ...prev,
        [curr]: curr === "brick-module" ? { eager: true } : {}
      }), {}),`,
      },
      {
        search: `shared: getSharedPackages({
        reactNativeVersion
      }).reduce((prev, curr) => ({
        ...prev,
        [curr]: curr === "brick-module" || curr === "@react-navigation/elements" ? { eager: true } : {}
      }), {}),`,
        replace: `shared: getSharedPackages({
        reactNativeVersion
      }).reduce((prev, curr) => ({
        ...prev,
        [curr]: curr === "brick-module" ? { eager: true } : {}
      }), {}),`,
      },
    ],
  },
  {
    label: 'Granite getSchemeUri fallback',
    files: [join(graniteReactNativePackageDir, 'src', 'native-modules', 'natives', 'getSchemeUri.ts')],
    replacements: [
      {
        search: `export function getSchemeUri() {
  return GraniteModule.getConstants().schemeUri;
}
`,
        replace: `export function getSchemeUri() {
  try {
    return GraniteModule.getConstants().schemeUri;
  } catch {
    return '';
  }
}
`,
      },
    ],
  },
  {
    label: 'Granite BrickModule fallback',
    files: [join(graniteReactNativePackageDir, 'src', 'native-modules', 'natives', 'GraniteBrownfieldModule.brick.ts')],
    replacements: [
      {
        search: `export const GraniteModule = BrickModule.get<GraniteBrownfieldModuleSpec>('GraniteBrownfieldModule');
`,
        replace: `export const GraniteModule = (() => {
  try {
    return BrickModule.get<GraniteBrownfieldModuleSpec>('GraniteBrownfieldModule');
  } catch {
    return {
      moduleName: 'GraniteBrownfieldModule',
      onVisibilityChanged: (() => ({ remove() {} })) as GraniteBrownfieldModuleSpec['onVisibilityChanged'],
      getConstants: () => ({
        schemeUri: '',
      }),
      closeView: async () => {},
    } as GraniteBrownfieldModuleSpec;
  }
})();
`,
      },
    ],
  },
  {
    label: 'Granite router index import fix',
    files: [join(graniteRouterPackageDir, 'dist', 'index.js'), join(graniteRouterPackageDir, 'dist', 'index.cjs')],
    replacements: [
      {
        search: `\t\tpageImports: pageFiles.map((page) => {
\t\t\treturn transformTemplate("import { Route as _%%componentName%%Route } from '../pages%%pagePath%%';", {
\t\t\t\tcomponentName: getComponentName(page),
\t\t\t\tpagePath: getPath(page)
\t\t\t});
\t\t}).join("\\n"),`,
        replace: `\t\tpageImports: pageFiles.map((page) => {
\t\t\treturn transformTemplate("import { Route as _%%componentName%%Route } from '../pages/%%pageImportPath%%';", {
\t\t\t\tcomponentName: getComponentName(page),
\t\t\t\tpageImportPath: page.replace(/\\.(tsx|ts)$/, ""),
\t\t\t\tpagePath: getPath(page)
\t\t\t});
\t\t}).join("\\n"),`,
      },
    ],
  },
  {
    label: 'Bedrock route-generator compat fix',
    files:
      bedrockRouteGeneratorPackageDir == null
        ? []
        : [join(bedrockRouteGeneratorPackageDir, 'dist', 'index.js'), join(bedrockRouteGeneratorPackageDir, 'dist', 'index.cjs')],
    replacements: [
      {
        search: `declare module 'react-native-bedrock' {`,
        replace: `declare module '@granite-js/react-native' {`,
      },
      {
        search: `    return transformTemplate("import { Route as _%%componentName%%Route } from '../pages%%pagePath%%';", {
      componentName,
      pagePath
    });`,
        replace: `    return transformTemplate("import { Route as _%%componentName%%Route } from '../pages/%%pageImportPath%%';", {
      componentName,
      pageImportPath: page.replace(/\\.(tsx|ts)$/, ""),
      pagePath
    });`,
      },
    ],
  },
  {
    label: 'Bedrock mpack pnpm enhancedResolver fix',
    files: mpackNextPackageDir == null ? [] : [join(mpackNextPackageDir, 'dist', 'metro', 'enhancedResolver.js')],
    replacements: [
      {
        search: `      modules: ["node_modules", import_path.default.join(rootPath2, "src")]
    });`,
        replace: `      modules: ["node_modules", import_path.default.join(rootPath2, "src")],
      alias: {
        "react-native": import_path.default.join(rootPath2, "node_modules", "react-native"),
        react: import_path.default.join(rootPath2, "node_modules", "react")
      }
    });`,
      },
    ],
  },
  {
    label: 'Bedrock mpack pnpm Metro config fix',
    files: mpackNextPackageDir == null ? [] : [join(mpackNextPackageDir, 'dist', 'metro', 'getMetroConfig.js')],
    replacements: [
      {
        search: `  return (0, import_loadConfig.mergeConfig)(defaultConfig, {
    watchFolders: [resolvedRootPath, packageRootPath],
    transformerPath: resolveVendors("metro-transform-worker/src"),`,
        replace: `  return (0, import_loadConfig.mergeConfig)(defaultConfig, {
    projectRoot: additionalConfig?.projectRoot || rootPath,
    watchFolders: [packageRootPath, ...additionalConfig?.watchFolders ?? []],
    transformerPath: resolveVendors("metro-transform-worker/src"),`,
      },
      {
        search: `      blockList: (0, import_exclusionList.default)(
        additionalConfig?.resolver?.blockList ? asArray(additionalConfig.resolver.blockList) : []
      )
    },`,
        replace: `      blockList: (0, import_exclusionList.default)(
        additionalConfig?.resolver?.blockList ? asArray(additionalConfig.resolver.blockList) : []
      ),
      nodeModulesPaths: [import_path.default.join(rootPath, "node_modules"), ...additionalConfig?.resolver?.nodeModulesPaths ?? []],
      extraNodeModules: additionalConfig?.resolver?.extraNodeModules || {},
      disableHierarchicalLookup: additionalConfig?.resolver?.disableHierarchicalLookup ?? true,
      resolverMainFields: additionalConfig?.resolver?.resolverMainFields ?? import_constants.RESOLVER_MAIN_FIELDS
    },`,
      },
    ],
  },
  {
    label: 'Bedrock mpack pnpm SHA1 fallback fix',
    files:
      mpackNextPackageDir == null
        ? []
        : [join(mpackNextPackageDir, 'dist', 'vendors', 'metro', 'src', 'node-haste', 'DependencyGraph.js')],
    replacements: [
      {
        search: `    const sha1 = this._hasteFS.getSha1(resolvedPath);
    if (!sha1) {
      throw new ReferenceError(
        \`SHA-1 for file \${filename} (\${resolvedPath}) is not computed.
         Potential causes:
           1) You have symlinks in your project - watchman does not follow symlinks.
           2) Check \\\`blockList\\\` in your metro.config.js and make sure it isn't excluding the file path.\`
      );
    }
    return sha1;`,
        replace: `    let sha1 = this._hasteFS.getSha1(resolvedPath);
    if (!sha1 && resolvedPath !== filename) {
      sha1 = this._hasteFS.getSha1(filename);
    }
    if (!sha1) {
      try {
        const crypto = require("crypto");
        const content = fs.readFileSync(resolvedPath);
        sha1 = crypto.createHash("sha1").update(content).digest("hex");
      } catch (error) {
        throw new ReferenceError(
          \`SHA-1 for file \${filename} (\${resolvedPath}) is not computed.
           Potential causes:
             1) You have symlinks in your project - watchman does not follow symlinks.
             2) Check \\\`blockList\\\` in your metro.config.js and make sure it isn't excluding the file path.
           Error: \${error.message}\`
        );
      }
    }
    return sha1;`,
      },
    ],
  },
];

let patchedCount = 0;

for (const targetGroup of targetFiles) {
  for (const targetFile of targetGroup.files) {
    if (!existsSync(targetFile)) {
      continue;
    }

    const source = readFileSync(targetFile, 'utf8');
    let nextSource = source;
    let changed = false;

    for (const { search, replace } of targetGroup.replacements) {
      if (nextSource.includes(replace)) {
        continue;
      }
      if (!nextSource.includes(search)) {
        continue;
      }
      nextSource = nextSource.replaceAll(search, replace);
      changed = true;
    }

    if (changed) {
      writeFileSync(targetFile, nextSource, 'utf8');
      patchedCount += 1;
      console.log(`Patched ${targetGroup.label} in ${targetFile}.`);
    }
  }
}

if (patchedCount > 0) {
  console.log(`Applied ${patchedCount} Windows/runtime patch(es).`);
}

const routerGenPath = join(__dirname, '..', 'src', 'router.gen.ts');
if (existsSync(routerGenPath)) {
  const routerGenSource = readFileSync(routerGenPath, 'utf8');
  const fixedRouterGenSource = routerGenSource
    .replaceAll("from '../pages/';", "from '../pages/index';")
    .replaceAll('from "../pages/";', 'from "../pages/index";')
    .replaceAll("declare module 'react-native-bedrock' {", "declare module '@granite-js/react-native' {");

  if (fixedRouterGenSource !== routerGenSource) {
    writeFileSync(routerGenPath, fixedRouterGenSource, 'utf8');
    console.log(`Patched router.gen root import in ${routerGenPath}.`);
  }
}
