import { chain, externalSchematic, Rule } from '@angular-devkit/schematics';

export interface LibraryOptions {
    name?: string;
    prefix?: string,
}

export default function (options: LibraryOptions): Rule {
    return () => {
        return chain([
            externalSchematic('@schematics/angular', 'library', options),
        ]);
    };
}
