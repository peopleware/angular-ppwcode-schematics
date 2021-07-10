import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';

import { ApplicationOptions } from '../../application';
import { GenerateGlobalErrorHandlingSchema } from './schema';

describe('Global Error Handling schematic', () => {
    const schematicRunner = new SchematicTestRunner(
        'ppwcode-angular-schematics',
        require.resolve('../../collection.json'),
    );

    const workspaceOptions = {
        name: 'workspace',
        newProjectRoot: 'projects',
        version: '6.0.0',
    };

    const applicationOptions: ApplicationOptions = {
        name: 'foo',
        routing: undefined,
        style: undefined,
        prefix: 'foo',
    };

    const defaultOptions: GenerateGlobalErrorHandlingSchema = {
        path: '/projects/foo/src/app',
        name: 'app-error-handler',
        project: 'foo'
    };

    let workspaceTree: UnitTestTree;
    beforeEach(async () => {
        workspaceTree = await schematicRunner.runSchematicAsync('workspace', workspaceOptions).toPromise();
        workspaceTree = await schematicRunner.runSchematicAsync('application', applicationOptions, workspaceTree).toPromise();
    });

    it('should generate the files', async () => {
        const options = { ...defaultOptions };

        const tree = await schematicRunner.runSchematicAsync('global-error-handling', options, workspaceTree)
            .toPromise();
        const files = tree.files;
        expect(files).toContain('/projects/foo/src/app/global-error-handling/global-error-handling.module.ts');
        expect(files).toContain('/projects/foo/src/app/global-error-handling/app-error-handler.ts');
    });

    it('should import in the app module', async () => {
        const options = { ...defaultOptions };

        const tree = await schematicRunner.runSchematicAsync('global-error-handling', options, workspaceTree)
            .toPromise();
        const moduleContent = tree.readContent('/projects/foo/src/app/app.module.ts');

        // Expect the import statement at the top.
        expect(moduleContent).toMatch(/import.*AppErrorHandler.*from '.\/global-error-handling\/app-error-handler'/);
        
        // Expect the forRoot call with AppErrorHander in the imports of the NgModule.
        expect(moduleContent).toMatch(/imports:\s*\[[^\]]+?,\r?\n\s+GlobalErrorHandlingModule.forRoot\(AppErrorHandler\)\r?\n/m);
    });
});
