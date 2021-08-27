# Library

The library schematic is used to generate a new library in the Angular workspace.

The schematic can be run by invoking the following command:

```bash
ng generate library [options] --collection=@ppwcode/angular-schematics
```

The collection-flag can be omited when `@ppwcode/angular-schematics` is set as the default collection in `angular.json`.

## Flow

First, we check whether the given name for the library is scoped (i.e. "@foo/bar"). If it is, we will make sure that the generated project directory doesn't contain the `@`-sign.

Then we execute the `library` schematic of `@schematics/angular`. After the library has been generated we override the [files](#files).

Then it's time to add dependencies to the `package.json` file of the workspace:

* `karma-spec-reporter@0.0.32`
* `angular-tslint-rules@1.20.4`
* `tslint-config-prettier@1.18.0`

And to the `package.json` file of the library:

* `zone.js@~0.11.4`
* `@angular/platform-browser-dynamic@~12.0.4`
* `tslint@6.1.3`
* `codelyzer@6.0.2`

We remove the configurations sections from the build target configuration and set up tslint use the same file in development builds as in production builds.

We make sure that `enableIvy` is set to false. In the past we had issues with building Ivy libraries so we turned this off. In some projects this has been switched to `'partial'` in Angular 12 so we are considering to change this default.

## Differences with the default schematic

The PPW-code schematics are opinionated so we differ from the default `ng generate library` schematic that ships with the Angular CLI.

### Options

| Option    | Description                                                    |
| --------- | -------------------------------------------------------------- |
| name      | The name of the new app.                                       |
| prefix    | The prefix to apply to generated selectors in the application. |

You will be prompted to provide a value for these options if not explicitly set while running the command.

### Files

We override several files that are generated:

* `tslint.json`
  * To leverage the extra dependencies we added.
* `karma.conf.js`
  * To leverage the extra dependencies we added.
  * To set coverage thresholds to 100%.
