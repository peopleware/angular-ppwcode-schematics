import { chain, Rule, Tree } from '@angular-devkit/schematics';
import { findModuleFromOptions } from '@angular/cdk/schematics';
import { getWorkspace } from '@schematics/angular/utility/workspace';

import { fallBackToDefaultPath } from './defaults';
import { getProject } from './project';
import { addModuleImports, createFilesIfTheyDontExistYet } from './rules';
import { GenerateGlobalErrorHandlingSchema } from './schema';


export default function (options: GenerateGlobalErrorHandlingSchema): Rule {
    return async (host: Tree) => {
        const workspace = await getWorkspace(host);

        const { project, projectType } = getProject(options, workspace);
        fallBackToDefaultPath(options, project, projectType);

        const modulePath = (await findModuleFromOptions(host, options))!;

        return chain([
            createFilesIfTheyDontExistYet(options),
            addModuleImports(host, modulePath, options)
        ]);
    };
}
