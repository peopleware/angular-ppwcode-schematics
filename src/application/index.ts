import {
  chain,
  externalSchematic,
  Rule,
  SchematicsException,
} from '@angular-devkit/schematics';
import {updateWorkspace} from "@schematics/angular/utility/workspace";
import {JsonObject} from "@angular-devkit/core";

interface ApplicationOptions {
  routing: boolean;
  style: string;
  name: string;
}

export default function(options: ApplicationOptions): Rule {
  return () => {
    setRouting(options);
    setStyle(options);
    return chain([
      externalSchematic('@schematics/angular', 'application', options),
      removeDuplicateStyle(options),
      addBuildOptions(options),
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

function removeDuplicateStyle(options: ApplicationOptions) {
  return updateWorkspace(workspace => {
    const project = workspace.projects.get(options.name);
    if (!project) {
      throw new SchematicsException(`Invalid project name (${options.name})`);
    }
    const extensions = project.extensions;
    const schematics = JSON.parse(JSON.stringify(extensions.schematics));
    const component = schematics["@schematics/angular:component"] as JsonObject;
    if (component["style"] === "scss") {
      delete component["style"];
    }
    if (Object.keys(component).length === 0) {
      delete schematics["@schematics/angular:component"];
    }
    extensions.schematics = schematics;
  });
}

function addBuildOptions(options: ApplicationOptions) {
  return updateWorkspace(workspace => {
    const project = workspace.projects.get(options.name);
    if (!project) {
      throw new SchematicsException(`Invalid project name (${options.name})`);
    }
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
  });
}
