import { ProjectDefinition, WorkspaceDefinition } from '@angular-devkit/core/src/workspace';

import { GenerateGlobalErrorHandlingSchema } from './schema';

/**
 * Updates the `project` schematic option to the name of the default project if it's undefined.
 * @param options The options for running the schematic.
 * @param workspace The definition of the current workspace.
 */
export const fallBackToDefaultProjectName = (options: GenerateGlobalErrorHandlingSchema, workspace: WorkspaceDefinition): void => {
    if (options.project === undefined) {
        options.project = workspace.extensions.defaultProject as string;
    }
};

/**
 * Updates the `path` schematic option to the combination of project source root and project type if it's undefined.
 * @param options The options for running the schematic.
 * @param project The definition of the project to execute the schematic on.
 * @param projectType The type of the project to execute the schematic on.
 */
export const fallBackToDefaultPath = (options: GenerateGlobalErrorHandlingSchema, project: ProjectDefinition, projectType: string): void => {
    if (options.path === undefined) {
        options.path = `${project.sourceRoot}/${projectType}`;
    }
};
