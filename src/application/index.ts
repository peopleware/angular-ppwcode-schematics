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
    configureEsLint(project);
    addTestOptions(project);
    removeProductionConfiguration(project);
  });
}

/**
 * The default configuration is our production configuration.
 * The only configuration that needs to override this is the development configuration used in the serve option.
 */
function removeProductionConfiguration(project: ProjectDefinition) {
  const buildTarget = project.targets.get('build');
  const serveTarget = project.targets.get('serve');
  if (buildTarget === undefined) {
    throw new SchematicsException("Build target missing (build)");
  }
  if (buildTarget.configurations === undefined) {
    throw new SchematicsException("Expected build options to be defined");
  }
  if (buildTarget.configurations.production === undefined) {
    throw new SchematicsException("Expected build options to be defined");
  }
  if (serveTarget === undefined) {
    throw new SchematicsException("Build target missing (serve)");
  }
  if (serveTarget.configurations === undefined) {
    throw new SchematicsException("Build target configurations missing (serve)");
  }

  delete serveTarget.configurations.production;
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
  delete buildTarget.configurations.production.budgets;
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
  if (buildTarget.configurations.development === undefined) {
    throw new SchematicsException("Expected build configurations development to be defined");
  }
  buildTarget.configurations.development['statsJson'] = false;
  delete buildTarget.configurations.development.vendorChunk; // Already defaulted correctly in build options
  delete buildTarget.configurations.development.sourceMap; // Already defaulted correctly in build options
  delete buildTarget.configurations.development.namedChunks; // Already defaulted correctly in build options
  delete buildTarget.defaultConfiguration; // There is no production configuration (the default is no configuration, only overrideable by the development configuration)
}

function configureEsLint(project: ProjectDefinition) {
  const esLintTargetDefinition: TargetDefinition = {
    builder: '@angular-eslint/builder:lint',
    options: {
      lintFilePatterns: [
        "src/**/*.ts",
        "src/**/*.html"
      ]
    }
  }
  project.targets.set('lint', esLintTargetDefinition);
}

function addDependenciesToPackageJson() {
  return (host: Tree) => {
    [
      {
        type: NodeDependencyType.Default,
        name: '@angular/flex-layout',
        version: '12.0.0-beta.34'
      },
      {
        type: NodeDependencyType.Default,
        name: '@angular/material',
        version: '~12.2.0'
      },
      {
        type: NodeDependencyType.Default,
        name: 'joi',
        version: '17.4.2'
      },
      {
        type: NodeDependencyType.Default,
        name: '@ngx-translate/core',
        version: '^13.0.0'
      },
      {
        type: NodeDependencyType.Default,
        name: '@ngx-translate/http-loader',
        version: '^6.0.0'
      },
      {
        type: NodeDependencyType.Default,
        name: '@ngxs/form-plugin',
        version: '3.7.2'
      },
      {
        type: NodeDependencyType.Default,
        name: '@ngxs/router-plugin',
        version: '3.7.2'
      },
      {
        type: NodeDependencyType.Default,
        name: '@ngxs/store',
        version: '3.7.2'
      },
      {
        type: NodeDependencyType.Default,
        name: '@ngxs-labs/data',
        version: '6.2.0'
      },
      {
        type: NodeDependencyType.Dev,
        name: 'karma-spec-reporter',
        version: '0.0.32',
      },
      {
        type: NodeDependencyType.Dev,
        name: '@ngxs/devtools-plugin',
        version: '3.7.2'
      },
      {
        type: NodeDependencyType.Dev,
        name: '@angular-eslint/builder',
        version: '12.3.1'
      },
      {
        type: NodeDependencyType.Dev,
        name: '@angular-eslint/eslint-plugin',
        version: '12.3.1'
      },
      {
        type: NodeDependencyType.Dev,
        name: '@angular-eslint/eslint-plugin-template',
        version: '12.3.1'
      },
      {
        type: NodeDependencyType.Dev,
        name: '@angular-eslint/schematics',
        version: '12.3.1'
      },
      {
        type: NodeDependencyType.Dev,
        name: '@angular-eslint/template-parser',
        version: '12.3.1'
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
