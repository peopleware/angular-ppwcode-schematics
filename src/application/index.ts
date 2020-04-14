import {
  chain,
  externalSchematic,
  Rule,
  SchematicsException,
} from '@angular-devkit/schematics';
import {updateWorkspace} from "@schematics/angular/utility/workspace";
import {JsonObject} from "@angular-devkit/core";
import {ProjectDefinition} from "@angular-devkit/core/src/workspace";
import {cloneDeep} from "lodash";

export interface ApplicationOptions {
  routing?: boolean;
  style?: string;
  name: string;
}

export default function(options: ApplicationOptions): Rule {
  return () => {
    setRouting(options);
    setStyle(options);
    return chain([
      externalSchematic('@schematics/angular', 'application', options),
      modifyWorkspace(options),
    ]);
  };
}

function setRouting(options: ApplicationOptions) {
  if (options.routing !== undefined) {
    throw new SchematicsException(`Invalid option: routing`);
  }
  options.routing = true;
}

function setStyle(options: ApplicationOptions) {
  if (options.style !== undefined) {
    throw new SchematicsException(`Invalid option: style`);
  }
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
