import {
  apply,
  applyTemplates,
  chain,
  externalSchematic,
  MergeStrategy,
  mergeWith,
  Rule,
  SchematicsException,
  Tree,
  url,
} from '@angular-devkit/schematics';
import {JsonObject, strings} from "@angular-devkit/core";
import {updateWorkspace} from "@schematics/angular/utility/workspace";
import {addPackageJsonDependency, NodeDependencyType} from "@schematics/angular/utility/dependencies";

interface ApplicationOptions {
    style: string;
}

export default function(options: ApplicationOptions): Rule {
  return () => {
    return chain([
      externalSchematic('@schematics/angular', 'workspace', options),
      setStyle(options),
      setDefaultCollection(),
      mergeWith(apply(url('./files'), [
        applyTemplates({
          utils: strings,
          ...options,
          'dot': '.'
        }),
      ]), MergeStrategy.AllowCreationConflict),
      addDependenciesToPackageJson(),
    ]);
  };
}

function setStyle(options: ApplicationOptions): Rule {
  if (options.style !== undefined) {
    throw new SchematicsException(`Invalid option: style`);
  }
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
    cliOptions.defaultCollection = "ppwcode-angular-schematics";
    workspace.extensions.cli = cliOptions;
  });
}

function addDependenciesToPackageJson() {
  return (host: Tree) => {
    [
      {
        type: NodeDependencyType.Dev,
        name: 'ppwcode-angular-schematics',
        version: '0.0.0',
      },
    ].forEach(dependency => addPackageJsonDependency(host, dependency));

    return host;
  };
}
