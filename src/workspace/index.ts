import {
  apply,
  applyTemplates,
  chain,
  externalSchematic,
  MergeStrategy,
  mergeWith,
  Rule,
  Tree,
  url,
} from '@angular-devkit/schematics';
import {JsonObject, strings} from "@angular-devkit/core";
import {updateWorkspace} from "@schematics/angular/utility/workspace";
import {addPackageJsonDependency, NodeDependencyType} from "@schematics/angular/utility/dependencies";

export interface WorkspaceOptions {
    name?: string;
    version?: string,
}

export default function(options: WorkspaceOptions): Rule {
  return () => {
    return chain([
      externalSchematic('@schematics/angular', 'workspace', options),
      setStyle(),
      setDefaultCollection(),
      mergeWith(apply(url('./files'), [
        applyTemplates({
          utils: strings,
          ...options,
          'dot': '.'
        }),
      ]), MergeStrategy.AllowCreationConflict),
      addDependenciesToPackageJson(),
      updateScriptsToPackageJson(),
    ]);
  };
}

function setStyle(): Rule {
  const schematics: JsonObject = {};
  const componentSchematicsOptions: JsonObject = {};
  componentSchematicsOptions.style = 'scss';
  schematics['@schematics/angular:component'] = componentSchematicsOptions;

  return updateWorkspace(workspace => {
    workspace.extensions.schematics = schematics;
  });
}

function setDefaultCollection(): Rule {
  return updateWorkspace(workspace => {
    const cliOptions: JsonObject = {};
    cliOptions.defaultCollection = "@ppwcode/angular-schematics";
    workspace.extensions.cli = cliOptions;
  });
}

function addDependenciesToPackageJson() {
  return (host: Tree) => {
    [
      {
        type: NodeDependencyType.Dev,
        name: '@ppwcode/angular-schematics',
        version: '3.1.0',
      },
      {
        type: NodeDependencyType.Dev,
        name: 'prettier',
        version: '2.0.5',
      },
      {
        type: NodeDependencyType.Dev,
        name: 'cross-env',
        version: '7.0.2'
      },
      {
        type: NodeDependencyType.Dev,
        name: 'husky',
        version: '4.3.0'
      },
      {
        type: NodeDependencyType.Dev,
        name: 'git-branch-is',
        version: '4.0.0'
      },
      {
        type: NodeDependencyType.Dev,
        name: 'stylelint',
        version: '13.13.1'
      },
      {
        type: NodeDependencyType.Dev,
        name: 'stylelint-config-standard',
        version: '22.0.0'
      }
    ].forEach(dependency => addPackageJsonDependency(host, dependency));

    return host;
  };
}

function updateScriptsToPackageJson(): Rule {
  return (host: Tree): Tree => {
    const path = `/package.json`;
    const file = host.read(path);
    const json = JSON.parse(file!.toString());
    delete json.scripts.lint;
    json.scripts = {
      ...json.scripts,
      "build": "npm run lint:prettier && npm run lint:lint && npm run test && ng build",
      "lint:prettier": "cross-env prettier --check \"**/*.{ts,js,md,html,scss}\"",
      "format:prettier": "cross-env prettier --write \"**/*.{ts,js,md,html,scss}\"",
      "test": "ng test --watch=false",
      "lint:lint": "ng lint",
      "format:lint": "ng lint --fix",
      "lint:styles": "stylelint \"src/app/**/*.scss\"",
    };
    json.husky = {
      "hooks": {
        "pre-push": "if git-branch-is -q master; then npm run lint:prettier && npm run lint:lint; fi",
      }
    };
    host.overwrite(path, JSON.stringify(json, null, 2));

    return host;
  }
}
