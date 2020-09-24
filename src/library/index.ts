import {
    apply,
    applyTemplates,
    chain,
    externalSchematic,
    mergeWith,
    move,
    Rule,
    Tree,
    url
} from '@angular-devkit/schematics';
import { MergeStrategy } from '@angular-devkit/schematics/src/tree/interface';
import { join, normalize, strings } from '@angular-devkit/core';
import { getWorkspace } from '@schematics/angular/utility/workspace';
import { relativePathToWorkspaceRoot } from '@schematics/angular/utility/paths';

export interface LibraryOptions {
    projectRoot?: string,
    name: string;
    prefix?: string,
}

export default function (options: LibraryOptions): Rule {
    return async (host: Tree) => {
        // If scoped project (i.e. "@foo/bar"), convert projectDir to "foo/bar".
        let scopeName = null;
        if (/^@.*\/.*/.test(options.name)) {
            const [scope, name] = options.name.split('/');
            scopeName = scope.replace(/^@/, '');
            options.name = name;
        }

        const workspace = await getWorkspace(host);
        const newProjectRoot = workspace.extensions.newProjectRoot as (string | undefined) || '';

        const scopeFolder = scopeName ? strings.dasherize(scopeName) + '/' : '';
        const folderName = `${scopeFolder}${strings.dasherize(options.name)}`;
        const projectRoot = join(normalize(newProjectRoot), folderName);
        return chain([
            externalSchematic('@schematics/angular', 'library', options),
            mergeWith(
                apply(url('./files'), [
                    applyTemplates({
                        relativePathToWorkspaceRoot: relativePathToWorkspaceRoot(projectRoot),
                        appName: options.name,
                        prefix: options.prefix,
                    }),
                    move(projectRoot),
                ]), MergeStrategy.AllowCreationConflict),
        ]);
    };
}
