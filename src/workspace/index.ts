import {
  chain,
  externalSchematic,
  Rule,
} from '@angular-devkit/schematics';

export default function(options: object): Rule {
  return () => {
    return chain([
      externalSchematic('@schematics/angular', 'workspace', options),
    ]);
  };
}
