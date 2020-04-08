import {
  chain,
  externalSchematic,
  Rule,
  SchematicsException,
} from '@angular-devkit/schematics';

interface ApplicationOptions {
  routing: boolean;
  style: string;
}

export default function(options: ApplicationOptions): Rule {
  return () => {
    setRouting(options);
    setStyle(options);
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

function setStyle(options: ApplicationOptions) {
  if (options.style !== undefined) {
    throw new SchematicsException(`Invalid option: style`);
  }
  options.style = 'scss';
}
