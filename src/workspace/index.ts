import {
  apply,
  applyTemplates,
  chain,
  externalSchematic,
  MergeStrategy,
  mergeWith,
  Rule,
  url,
} from '@angular-devkit/schematics';
import {strings} from "@angular-devkit/core";

export default function(options: object): Rule {
  return () => {
    return chain([
      externalSchematic('@schematics/angular', 'workspace', options),
      mergeWith(apply(url('./files'), [
        applyTemplates({
          utils: strings,
          ...options,
          'dot': '.'
        }),
      ]), MergeStrategy.AllowCreationConflict),
    ]);
  };
}
