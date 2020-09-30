import {
    apply,
    applyTemplates,
    chain,
    externalSchematic,
    mergeWith,
    move,
    Rule,
    SchematicsException,
    Tree,
    url
} from '@angular-devkit/schematics';
import { MergeStrategy } from '@angular-devkit/schematics/src/tree/interface';
import { join, normalize, strings } from '@angular-devkit/core';
import { getWorkspace, updateWorkspace } from '@schematics/angular/utility/workspace';
import { relativePathToWorkspaceRoot } from '@schematics/angular/utility/paths';
import { addPackageJsonDependency, NodeDependencyType } from '@schematics/angular/utility/dependencies';
import { ProjectDefinition } from '@angular-devkit/core/src/workspace';
import { cloneDeep } from 'lodash';
import { parseConfigFileTextToJson } from 'typescript';

export interface LibraryOptions {
    projectRoot?: string,
    name: string;
    prefix?: string,
}

export default function (options: LibraryOptions): Rule {
    return async (host: Tree) => {
        const originalOptions = cloneDeep(options); // Use the exact same options when using the external schematic, and do what we want with the current one
        const fullName = originalOptions.name;
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
            externalSchematic('@schematics/angular', 'library', originalOptions),
            mergeWith(
                apply(url('./files'), [
                    applyTemplates({
                        relativePathToWorkspaceRoot: relativePathToWorkspaceRoot(projectRoot),
                        appName: options.name,
                        prefix: options.prefix,
                    }),
                    move(projectRoot),
                ]), MergeStrategy.AllowCreationConflict),
            addDependenciesToPackageJson(),
            modifyWorkspace(fullName),
            updateAngularCompilerOptionsToTsConfig(projectRoot),
            removeTsconfigProduction(projectRoot),
        ]);
    };

    function addDependenciesToPackageJson() {
        return (host: Tree) => {
            [
                {
                    type: NodeDependencyType.Dev,
                    name: 'karma-spec-reporter',
                    version: '0.0.32',
                },
                {
                    type: NodeDependencyType.Dev,
                    name: 'angular-tslint-rules',
                    version: '1.20.4',
                },
                {
                    type: NodeDependencyType.Dev,
                    name: 'tslint-config-prettier',
                    version: '1.18.0',
                },
            ].forEach(dependency => addPackageJsonDependency(host, dependency));
            return host;
        };
    }

    function modifyWorkspace(projectName: string): Rule {
        return updateWorkspace(workspace => {
            const project = workspace.projects.get(projectName);
            if (!project) {
                throw new SchematicsException(`Invalid project name (${projectName})`);
            }
            removeConfigurationsFromBuildConfigurations(project);
        });
    }

    function updateAngularCompilerOptionsToTsConfig(folderName: string): Rule {
        return (host: Tree): Tree => {
            const path = `${folderName}/tsconfig.lib.json`;
            const file = host.read(path);
            const json = parseConfigFileTextToJson(path, file!.toString())
            json.config.angularCompilerOptions = {
                ...json.config.angularCompilerOptions,
                "enableIvy": false
            };
            host.overwrite(path, JSON.stringify(json.config, null, 2));
            return host;
        }
    }

    function removeConfigurationsFromBuildConfigurations(project: ProjectDefinition): void {
        const targets = project.targets;
        const buildTarget = targets.get('build');
        if (buildTarget === undefined) {
            throw new SchematicsException("Architect target missing (build)");
        }
        if (buildTarget.configurations === undefined) {
            throw new SchematicsException("Expected build options to be defined");
        }
        delete buildTarget["configurations"];
    }

    function removeTsconfigProduction(libFolder: string) {
        return (host: Tree) => {
            host.delete(libFolder + '/tsconfig.lib.prod.json');
            return host;
        }
    }
}
