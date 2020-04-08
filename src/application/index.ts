import {
  chain,
  externalSchematic,
  Rule,
  SchematicsException,
} from '@angular-devkit/schematics';

interface ApplicationOptions {
  routing: boolean;
}

export default function(options: ApplicationOptions): Rule {
  return () => {
    setRouting(options);
    return chain([
      externalSchematic('@schematics/angular', 'application', options),
    ]);
  };
}

function setRouting(options: ApplicationOptions) {
  if (options.routing !== undefined) {
    throw new SchematicsException(`Invalid option: routing`);
  }
  options.routing = true;
}
