import { SchematicTestRunner } from '@angular-devkit/schematics/testing';

describe('Ng New Schematic', () => {
  const schematicRunner = new SchematicTestRunner(
    'ppwcode-angular-schematics',
    require.resolve('../collection.json'),
  );
  const defaultOptions = {
    name: 'foo',
    directory: 'bar',
    version: '6.0.0',
    prefix: 'ngnew',
    createApplication: true,
  };

  it('should create files of a workspace', async () => {
    const tree = await schematicRunner.runSchematicAsync('ng-new', defaultOptions).toPromise();
    const files = tree.files;
    expect(files).toContain('/bar/angular.json');
  });

  it('should create files of an application', async () => {
    const tree = await schematicRunner.runSchematicAsync('ng-new', defaultOptions).toPromise();
    const files = tree.files;
    expect(files).toEqual(jasmine.arrayContaining([
      '/bar/tsconfig.app.json',
      '/bar/src/main.ts',
      '/bar/src/app/app.module.ts',
      '/bar/e2e/src/app.po.ts',
      '/bar/e2e/src/app.e2e-spec.ts',
      '/bar/e2e/tsconfig.json',
      '/bar/e2e/protractor.conf.js',
    ]));
  });

  it('should not create files of an application', async () => {
    const options = { ...defaultOptions };
    options.createApplication = false;

    const tree = await schematicRunner.runSchematicAsync('ng-new', options).toPromise();
    const files = tree.files;
    expect(files).not.toContain('/bar/tsconfig.app.json');
    expect(files).not.toContain('/bar/src/main.ts');
    expect(files).not.toContain('/bar/src/app/app.module.ts');
    expect(files).not.toContain('/bar/e2e/src/app.po.ts');
    expect(files).not.toContain('/bar/e2e/src/app.e2e-spec.ts');
    expect(files).not.toContain('/bar/e2e/tsconfig.json');
    expect(files).not.toContain('/bar/e2e/protractor.conf.js');
  });

  it('should should set the prefix in angular.json and in app.component.ts', async () => {
    const tree = await schematicRunner.runSchematicAsync('ng-new', defaultOptions).toPromise();
    const content = tree.readContent('/bar/angular.json');
    expect(content).toMatch(/"prefix": "ngnew"/);
  });

});
