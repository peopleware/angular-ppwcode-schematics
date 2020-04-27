import {
  chain,
  externalSchematic,
  Rule,
} from '@angular-devkit/schematics';

export default function(options: any): Rule {
  return () => {
    return chain([
      externalSchematic('@schematics/angular', 'ng-new', options),
    ]);
  };
}
