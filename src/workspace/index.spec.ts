import {SchematicTestRunner} from "@angular-devkit/schematics/testing";

describe('Workspace Schematic', () => {
  const schematicRunner = new SchematicTestRunner(
    'ppwcode-angular-schematics',
    require.resolve('../collection.json'),
  );

  const defaultOptions = {
    name: 'workspace',
    version: '6.0.0',
  };

  it('should set style scss globally', async () => {
    const tree = await schematicRunner.runSchematicAsync('workspace', defaultOptions).toPromise();
    const config = JSON.parse(tree.readContent('/angular.json'));
    expect(config.schematics["@schematics/angular:component"]).toBeDefined();
    expect(config.schematics["@schematics/angular:component"].style).toEqual('scss');
  });

  it('should set default collection', async () => {
    const tree = await schematicRunner.runSchematicAsync('workspace', defaultOptions).toPromise();
    const config = JSON.parse(tree.readContent('/angular.json'));
    expect(config.cli.defaultCollection).toEqual('@ppwcode/angular-schematics');
  });

});
