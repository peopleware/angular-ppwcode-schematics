import { classify, dasherize } from '@angular-devkit/core/src/utils/strings';
import {
    apply,
    applyTemplates,
    MergeStrategy,
    mergeWith,
    move,
    Rule,
    SchematicsException,
    Tree,
    url,
} from '@angular-devkit/schematics';
import { addModuleImportToModule, insertImport } from '@angular/cdk/schematics';
import { InsertChange } from '@schematics/angular/utility/change';

import { getTsSourceFile } from './files';
import { GenerateGlobalErrorHandlingSchema } from './schema';

/**
 * Generates a Rule that will create the files based on the templates and move them to
 * the path that has been set on the schematic options.
 * @param options The options for running the schematic.
 * @throws a SchematicsException if the name of the generated class will be ErrorHandler.
 * @returns A rule to be chained.
 */
export const createFilesIfTheyDontExistYet = (options: GenerateGlobalErrorHandlingSchema): Rule => {
    if (classify(options.name) === 'ErrorHandler') {
        throw new SchematicsException('This would generate a class with the name ErrorHandler, which conflicts with the interface exported by Angular.');
    }

    return mergeWith(
        apply(url('./files'), [
            applyTemplates({
                dasherize,
                classify,
                name: options.name,
            }),
            move(options.path),
        ]), MergeStrategy.AllowCreationConflict);
};

/**
 * Generates a rule that will add the global error handling module to the given module file and imports the error handler
 * to the module file as well.
 * 
 * The error handler will be passed as the first argument to the global error handling module that is imported.
 * @param host The host tree structure.
 * @param modulePath The path of the module file.
 * @param options The options for running the schematic.
 * @returns A rule to be chained.
 */
export const addModuleImports = (host: Tree, modulePath: string, options: GenerateGlobalErrorHandlingSchema): Rule => {
    return () => {
        addModuleImportToModule(
            host,
            modulePath,
            `GlobalErrorHandlingModule.forRoot(${classify(options.name)})`,
            './global-error-handling/global-error-handling.module'
        );

        const moduleFile = getTsSourceFile(host, modulePath);

        // Update the module file to add an import statement for the error displayer.
        const updateRecorder = host.beginUpdate(modulePath);
        const change = insertImport(moduleFile, modulePath, classify(options.name), `./global-error-handling/${dasherize(options.name)}`);
        if (change instanceof InsertChange) {
            updateRecorder.insertRight(change.pos, change.toAdd);
        }

        host.commitUpdate(updateRecorder);
    };
};
