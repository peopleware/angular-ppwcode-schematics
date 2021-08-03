# Application

The application schematic is used to generate a new application in the Angular workspace.

The schematic can be run by invoking the following command:

```bash
ng generate application [options] --collection=@ppwcode/angular-schematics
```

The collection-flag can be omited when `@ppwcode/angular-schematics` is set as the default collection in `angular.json`.

## Flow

First, we extend the [options](#options) that are passed to the command with the following defaults:

* `--routing` to `true`
* `--style` to `scss`

Then we execute the `application` schematic of `@schematics/angular`. After the application has been generated we modify the workspace:

* Remove duplicates regarding styling.
* Set the build options
  * `statsJson` to `true`
  * `sourceMap` to `true`
  * `vendorChunk` to `true`
  * `namedChunk` to `true`
  * `outputPath` to `'dist'`
* Move the budgets configuration from production to build.
* Configure TSLint
* Add options for testing
* Remove the production configuration because it has been moved in the previous steps to other configuration sections.

After modifying the workspace, it is time to override the [files](#files).

We add some dependencies for testing and linting as well:

* `karma-spec-reporter@0.0.32`
* `angular-tslint-rules@1.20.4`
* `tslint-config-prettier@1.18.0`
* `tslint@6.1.3`
* `codelyzer@6.0.2`

Finally we remove the environments file because we try to approach production as much as possible during development.

## Differences with the default schematic

The PPW-code schematics are opinionated so we differ from the default `ng generate application` schematic that ships with the Angular CLI.

### Options

| Option    | Description                                                    |
| --------- | -------------------------------------------------------------- |
| name      | The name of the new app.                                       |
| prefix    | The prefix to apply to generated selectors in the application. |

You will be prompted to provide a value for these options if not explicitly set while running the command.

### Files

We override several files that are generated:

* `main.ts`
  * We don't use production environment variables.
* `tslint.json`
  * To leverage the extra dependencies we added.
* `karma.conf.js`
  * To leverage the extra dependencies we added.
  * To set coverage thresholds to 100%.
