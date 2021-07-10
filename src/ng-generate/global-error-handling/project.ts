import { ProjectDefinition, WorkspaceDefinition } from '@angular-devkit/core/src/workspace';
import { SchematicsException } from '@angular-devkit/schematics';

import { fallBackToDefaultProjectName } from './defaults';
import { GenerateGlobalErrorHandlingSchema } from './schema';

/**
 * Gets the definition of a project and its related type. If no project name is explicitly given, we fall back to the
 * default project.
 * @param options The options for running the schematic.
 * @param workspace The current workspace definition.
 * @throws a SchematicsException if the project name is undefined.
 * @throws a SchematicsException if the project could not be found in the workspace.
 * @returns The project definition and its related type.
 */
export const getProject = (options: GenerateGlobalErrorHandlingSchema, workspace: WorkspaceDefinition): { project: ProjectDefinition, projectType: string } => {
    fallBackToDefaultProjectName(options, workspace);

    if (options.project === undefined) {
        throw new SchematicsException(`Invalid project name: ${options.project}`);
    }

    const project = workspace.projects.get(options.project);
    if (project === undefined) {
        throw new SchematicsException(`Project ${options.project} not found in the workspace`);
    }

    return {
        project,
        projectType: project.extensions.projectType === 'application' ? 'app' : 'lib'
    };
};
