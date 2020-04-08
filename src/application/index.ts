import {
  chain,
  externalSchematic,
  Rule,
} from '@angular-devkit/schematics';

interface ApplicationOptions {
}

export default function(options: ApplicationOptions): Rule {
  return () => {
    return chain([
      externalSchematic('@schematics/angular', 'application', options),
    ]);
  };
}
