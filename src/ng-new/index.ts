import {
  apply,
  chain,
  empty,
  mergeWith,
  move,
  Rule,
  schematic,
  SchematicsException,
} from '@angular-devkit/schematics';
import {ApplicationOptions} from "../application";
import {WorkspaceOptions} from "../workspace";

export default function(options: any): Rule {
  if (!options.name) {
    throw new SchematicsException(`Invalid options, "name" is required.`);
  }

  if (!options.directory) {
    options.directory = options.name;
  }

  const workspaceOptions: WorkspaceOptions = {
    name: options.name,
    version: options.version,
  };

  const applicationOptions: ApplicationOptions = {
    projectRoot: '',
    name: options.name,
    skipInstall: true,
    prefix: options.prefix,
  };

  return () => {
    return chain([
      mergeWith(
          apply(empty(), [
            schematic('workspace', workspaceOptions),
            schematic('application', applicationOptions),
            move(options.directory),
          ]),
      ),
    ]);
  };
}
