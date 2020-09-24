import { apply, applyTemplates, chain, externalSchematic, mergeWith, Rule, url } from '@angular-devkit/schematics';
import { MergeStrategy } from '@angular-devkit/schematics/src/tree/interface';

export interface LibraryOptions {
    name?: string;
    prefix?: string,
}

export default function (options: LibraryOptions): Rule {
    return () => {
        return chain([
            externalSchematic('@schematics/angular', 'library', options),
            mergeWith(
                apply(url('./files'), [
                    applyTemplates({
                        prefix: options.prefix,
                    }),
                ]), MergeStrategy.AllowCreationConflict),
        ]);
    };
}
