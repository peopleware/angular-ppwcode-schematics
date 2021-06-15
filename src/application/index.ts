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
import { ProjectDefinition, TargetDefinition } from "@angular-devkit/core/src/workspace";
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
            prefix: options.prefix,
          }),
          move(appDir),
        ]), MergeStrategy.AllowCreationConflict),
      addDependenciesToPackageJson(),
      removeEnvironments(appDir),
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
    configureTsLint(project);
    addTestOptions(project);
    updateServeOptions(project);
    removeProductionConfiguration(project);
  });
}

/**
 * The default configuration is our production configuration.
 * The only configuration that needs to override this is the development configuration used in the serve option.
 */
function removeProductionConfiguration(project: ProjectDefinition) {
  const buildTarget = project.targets.get('build');
  if (buildTarget === undefined) {
    throw new SchematicsException("Build target missing (build)");
  }
  if (buildTarget.configurations === undefined) {
    throw new SchematicsException("Expected build options to be defined");
  }
  if (buildTarget.configurations.production === undefined) {
    throw new SchematicsException("Expected build options to be defined");
  }

  delete buildTarget.configurations.production;
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
  buildTarget.options['statsJson'] = true;
  buildTarget.options['sourceMap'] = true;
  buildTarget.options['vendorChunk'] = true;
  buildTarget.options['namedChunks'] = true;
  buildTarget.options['outputPath'] = 'dist';
}

function updateServeOptions(project: ProjectDefinition) {
  const targets = project.targets;
  const serveTarget = targets.get('serve');
  if (serveTarget === undefined) {
    throw new SchematicsException("Build target missing (serve)");
  }
  if (serveTarget.configurations === undefined) {
    throw new SchematicsException("Build target configurations missing (serve)");
  }
  delete serveTarget.configurations.production;
}

function addTestOptions(project: ProjectDefinition) {
  const testTarget = project.targets.get('test');
  if (testTarget === undefined) {
    throw new SchematicsException("Build target missing (test)");
  }
  if (testTarget.options === undefined) {
    throw new SchematicsException("Expected build options to be defined");
  }
  testTarget.options['codeCoverage'] = true;
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
      buildOptimizer: false,
      optimization: false,
      extractLicenses: false,
      statsJson: false,
      sourceMap: true,
      vendorChunk: true,
      namedChunks: true
    }
  };
  delete buildTarget['defaultConfiguration'];
}

function configureTsLint(project: ProjectDefinition) {
  const tsLintTargetDefinition: TargetDefinition = {
    builder: '@angular-devkit/build-angular:tslint',
    options: {
      tsConfig: [
        'tsconfig.app.json',
        'tsconfig.spec.json'
      ],
      exclude: [
        '**/node_modules/**'
      ]
    }
  }
  project.targets.set('lint', tsLintTargetDefinition);
}

function addDependenciesToPackageJson() {
  return (host: Tree) => {
    [
      {
        type: NodeDependencyType.Dev,
        name: 'karma-spec-reporter',
        version: '0.0.32',
      },
      {
        type: NodeDependencyType.Dev,
        name: 'angular-tslint-rules',
        version: '1.20.4',
      },
      {
        type: NodeDependencyType.Dev,
        name: 'tslint-config-prettier',
        version: '1.18.0',
      },
      {
        type: NodeDependencyType.Dev,
        name: 'tslint',
        version: '6.1.3',
      },
      {
        type: NodeDependencyType.Dev,
        name: 'codelyzer',
        version: '6.0.2',
      },
    ].forEach(dependency => addPackageJsonDependency(host, dependency));

    return host;
  };
}

function removeEnvironments(appDir: string) {
  return (host: Tree) => {
    host.delete(appDir + '/src/environments/environment.ts');
    host.delete(appDir + '/src/environments/environment.prod.ts');
    return host;
  }
}
