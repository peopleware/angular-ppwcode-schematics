import {
  apply,
  applyTemplates,
  chain,
  externalSchematic,
  mergeWith,
  move,
  Rule,
  SchematicsException,
  Tree, url,
} from '@angular-devkit/schematics';
import {getWorkspace, updateWorkspace} from "@schematics/angular/utility/workspace";
import {join, JsonObject, normalize} from "@angular-devkit/core";
import {ProjectDefinition} from "@angular-devkit/core/src/workspace";
import {cloneDeep} from "lodash";
import {relativePathToWorkspaceRoot} from "@schematics/angular/utility/paths";
import {MergeStrategy} from "@angular-devkit/schematics/src/tree/interface";
import {addPackageJsonDependency, NodeDependencyType} from "@schematics/angular/utility/dependencies";

export interface ApplicationOptions {
  projectRoot?: string,
  routing?: boolean;
  style?: string;
  name: string;
  skipInstall?: boolean;
  prefix?: string;
}

export default function(options: ApplicationOptions): Rule {
  return async (host: Tree) => {
    const workspace = await getWorkspace(host);
    const newProjectRoot = workspace.extensions.newProjectRoot as (string | undefined) || '';
    const isRootApp = options.projectRoot !== undefined;
    const appDir = isRootApp
      ? options.projectRoot as string
      : join(normalize(newProjectRoot), options.name);

    setRouting(options);
    setStyle(options);
    return chain([
      externalSchematic('@schematics/angular', 'application', options),
      modifyWorkspace(options),
      mergeWith(
        apply(url('./files'), [
          applyTemplates({
            relativePathToWorkspaceRoot: relativePathToWorkspaceRoot(appDir),
            appName: options.name,
          }),
          move(appDir),
        ]), MergeStrategy.AllowCreationConflict),
      addDependenciesToPackageJson(),
    ]);
  };
}

function setRouting(options: ApplicationOptions) {
  options.routing = true;
}

function setStyle(options: ApplicationOptions) {
  options.style = 'scss';
}

function modifyWorkspace(options: ApplicationOptions) {
  return updateWorkspace(workspace => {
    const project = workspace.projects.get(options.name);
    if (!project) {
      throw new SchematicsException(`Invalid project name (${options.name})`);
    }
    removeDuplicateStyle(project);
    addBuildOptions(project);
    moveBudgets(project);
    configureBuildConfigurations(project);
  });
}

function removeDuplicateStyle(project: ProjectDefinition) {
  const extensions = project.extensions;
  const schematics = cloneDeep(extensions.schematics) as JsonObject;
  const component = schematics["@schematics/angular:component"] as JsonObject;
  if (component["style"] === "scss") {
    delete component["style"];
  }
  if (Object.keys(component).length === 0) {
    delete schematics["@schematics/angular:component"];
  }
  extensions.schematics = schematics;
}

function addBuildOptions(project: ProjectDefinition) {
  const buildTarget = project.targets.get('build');
  if (buildTarget === undefined) {
    throw new SchematicsException("Build target missing (build)");
  }
  if (buildTarget.options === undefined) {
    throw new SchematicsException("Expected build options to be defined");
  }
  buildTarget.options['buildOptimizer'] = true;
  buildTarget.options['extractCss'] = true;
  buildTarget.options['extractLicenses'] = true;
  buildTarget.options['optimization'] = true;
  buildTarget.options['statsJson'] = true;
  buildTarget.options['outputPath'] = 'dist';
}

// move budgets configuration from configuration.production to build
function moveBudgets(project: ProjectDefinition) {
  const buildTarget = project.targets.get('build');
  if (buildTarget === undefined) {
    throw new SchematicsException("Build target missing (build)");
  }
  if (buildTarget.options === undefined) {
    throw new SchematicsException("Expected build options to be defined");
  }
  if (buildTarget.configurations === undefined) {
    throw new SchematicsException("Expected build configurations to be defined");
  }
  if (buildTarget.configurations.production === undefined) {
    throw new SchematicsException("Expected build configurations.production to be defined");
  }
  const budgets = buildTarget.configurations.production.budgets;
  buildTarget.options['budgets'] = cloneDeep(budgets);
}

function configureBuildConfigurations(project: ProjectDefinition) {
  const buildTarget = project.targets.get('build');
  if (buildTarget === undefined) {
    throw new SchematicsException("Build target missing (build)");
  }
  if (buildTarget.options === undefined) {
    throw new SchematicsException("Expected build options to be defined");
  }
  if (buildTarget.configurations === undefined) {
    throw new SchematicsException("Expected build configurations to be defined");
  }

  buildTarget.configurations  = {
    serve: {
      aot: false,
      buildOptimizer: false,
      optimization: false,
      extractLicenses: false,
      statsJson: false,
      fileReplacements: [{
        replace: 'src/environments/environment.ts',
        with: 'src/environments/environment.development.ts',
      }]
    }
  };
}

function addDependenciesToPackageJson() {
  return (host: Tree) => {
    [
      {
        type: NodeDependencyType.Dev,
        name: 'karma-spec-reporter',
        version: '0.0.32',
      },
    ].forEach(dependency => addPackageJsonDependency(host, dependency));

    return host;
  };
}
