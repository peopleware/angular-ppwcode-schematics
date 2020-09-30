import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { LibraryOptions } from './index';

describe('Library Schematic', () => {
    const schematicRunner = new SchematicTestRunner(
        'ppwcode-angular-schematics',
        require.resolve('../collection.json'),
    );

    const workspaceOptions = {
        name: 'workspace',
        newProjectRoot: 'projects',
        version: '6.0.0',
    };

    const defaultOptions: LibraryOptions = {
        name: 'foo',
        projectRoot: undefined,
        prefix: 'application',
    };

    let workspaceTree: UnitTestTree;
    beforeEach(async () => {
        workspaceTree = await schematicRunner.runSchematicAsync('workspace', workspaceOptions).toPromise();
    });

    it('should create files', async () => {
        const tree = await schematicRunner.runSchematicAsync('library', defaultOptions, workspaceTree).toPromise();
        const files = tree.files;
        expect(files).toContain('/projects/foo/ng-package.json');
    });

    it('should not create tsconfig.lib.prod.json files', async () => {
        const tree = await schematicRunner.runSchematicAsync('library', defaultOptions, workspaceTree).toPromise();
        const files = tree.files;
        expect(files).not.toContain('/projects/foo/tsconfig.lib.prod.json');
    });

    it('should set and handle module', async () => {
        const options = { ...defaultOptions };

        const tree = await schematicRunner.runSchematicAsync('library', options, workspaceTree)
            .toPromise();
        const files = tree.files;
        expect(files).toContain('/projects/foo/src/lib/foo.module.ts');
    });

    it('should remove configurations from angular build settings', async () => {
        const options = { ...defaultOptions };

        const tree = await schematicRunner.runSchematicAsync('library', options, workspaceTree)
            .toPromise();
        const config = JSON.parse(tree.readContent('/angular.json'));
        const build = config.projects.foo.architect.build;
        expect(build).toBeDefined();
        expect(build.configurations).toBeUndefined();
    });

    it('should should set the prefix in angular.json and in foo.component.ts', async () => {
        const options = { ...defaultOptions };

        const tree = await schematicRunner.runSchematicAsync('library', options, workspaceTree)
            .toPromise();
        const content = tree.readContent('/angular.json');
        expect(content).toMatch(/"prefix": "application"/);
    });

    it('should should set enableIvy to false in tsconfig.lib.json', async () => {
        const options = { ...defaultOptions };

        const tree = await schematicRunner.runSchematicAsync('library', options, workspaceTree)
            .toPromise();
        const tsconfig = JSON.parse(tree.readContent('/projects/foo/tsconfig.lib.json'));
        expect(tsconfig.angularCompilerOptions.enableIvy).toBeFalse();
    });

});
