# lerna-repo-tutorial

This repo provides a playground for an introduction to multi-package management using Lerna.

## Create the repo

``` bash
mkdir lerna-repo
cd lerna-repo
```

## create a `package.json`

``` json
{
  "name": "tutorial",
  "private": true,
  "version": "0.1.0",
  "description": "lerna tutorial toy repository"
}
```

This is private because you probably want to publish contained packages but not the root package.

## Create `lerna.json`

``` json
{
  "version": "0.1.0",
  "npmClient": "npm",
  "packages": ["packages/*"]
}
```

## Install and initialize lerna

If `lerna-repo` isn't already a git repo, `lerna init` will make it one.

``` bash
npm install --save-dev lerna
mkdir packages
npx lerna init
```

## Create a nested package called `library1`

``` bash
mkdir packages/library1
```
Now create `packages/library1/package.json`:

``` json
{
  "name": "library1",
  "version": "0.1.0",
  "description": "lerna example and test repo library 1",
  "main": "library1.js",
  "files": [ "library1.js" ],
  "license": "ISC"
}
```

and a toy library in `library1.js`:

``` javascript
const Library1 = (function () {
  return {
    name: "Library1"
  }
})()

if (typeof require !== 'undefined' && typeof exports !== 'undefined')
  module.exports = Library1
```

You can instead use `npx lerna create library1` and answer server prompts for information. This would create the directory with a `package.json`, skeleton `README.md`, a skeletal library `lib/library1.js` and a placeholder test in `__tests__`.

## Lerna plays well with `@scoped` package names

Suppose we have a [package scope](https://docs.npmjs.com/misc/scope) `scope1`, we needn't include the '@'-sign in the package directory:

``` bash
mkdir packages/scope1-library2
```

We can copy the above `packages/library1/package.json` and make a few changes:

``` json
  "name": "@scope1/library2",
  "description": "lerna example and test repo scope 1, library 2",
  "main": "scope1-library2.js",
  "files": [ "scope1-library2.js" ],
```

You needn't use a library-specific names for the .js file: it could instead be e.g. `index.js`.

Let's copy the previous library, with an exciting twist in the description:

``` javascript
    name: "Scope1/Library2 requires " + require("library1").name
```

Now let's say that `@scope1/library2` requires `library1`:

``` bash
npx lerna add library1 packages/scope1-library2
```
You should see this encouraging output telling you how many packages lerna is managing:
```
lerna notice cli v3.13.1
lerna info Adding library1 in 1 package
lerna info Bootstrapping 2 packages
lerna info Symlinking packages and binaries
lerna success Bootstrapped 2 packages
```

Lerna will add a dependency to `package.json`:

``` json
  "dependencies": {
    "library1": "^0.1.0"
  }
```

and create `packages/scope1-library2/node_modules/`.
Because we added a package managed by lerna, `node_modules` will add a symlink back to library1 (`library1 -> ../../library1`). If it's not a managed package, it behaves like `npm install X` or `yarn add X`. If you make a typo, you'll get an error if the typo'd package doesn't happen to exist in your chosen registry (e.g. npm.org).

Also encouraging is the fact that lerna looks for the package in question, so if you mistype, you'll either get an error, or, 


## Add a CLI tool

Because CLI tools frequently leverage special libraries for command line arguments and I/O, it's nice to sequester them in their own package so users of your library don't need to install every known package:

``` bash
mkdir packages/scope1-cli
mkdir packages/scope1-cli/bin
```

Here's a minimal package.json:

``` json
{
  "name": "@scope1/cli",
  "version": "1.0.0",
  "description": "lerna example and test repo scope 1, command line interface",
  "bin": [ "bin/command1" ],
  "author": "ericP",
  "license": "ISC"
}
```

and a script `packages/scope1-cli/bin/command1` which makes bold claims:

``` javascript
#!/usr/bin/env node
console.log("@scope1/cli command1 does it all!")
```

Let's say that `command1` requires `@scope1/library2`:

``` bash
npx lerna add @scope1/library2 packages/scope1-cli
```

## Testing sub-packages

Let's get some confidence that these packages are doing what they're supposed to by doing a local install of the CLI:

``` bash
mkdir ../tutorial-user
cd ../tutorial-user
npm install ../tutorial/packages/scope1-cli/
npx command1
```
and we get a warm, fuzzing feeling because we see our bold claim:

```
@scope1/cli command1 requires Scope1/Library2 requires Library1
@scope1/cli command1 see all!
```

Make sure you come back to the tutorial directory before we go on to testing.

``` bash
cd ../tutorial
```

## Testing

We'll use the same dance to create a (minimal) package directory. Here we use Mocha conventions, but this works with Jest as well.

``` bash
mkdir packages/scope1-test
mkdir packages/scope1-test/test
```

with a `packages/scope1-test/package.json`:

``` json
{
  "name": "@scope1/test",
  "private": true,
  "description": "lerna example and test repo scope 1 tests",
  "scripts": { "test": "mocha" },
  "keywords": [],
  "author": "ericP",
  "license": "ISC"
}
```

Now we finally use Lerna to add an outside package:

``` bash
npx lerna add mocha packages/scope1-test
```

as well as an internal package (`@scope1/cli`):

``` bash
npx lerna add @scope1/cli packages/scope1-test
```

The latter has the desired effect of symlinking to `packages/scope-cli` in `node_modules/@scope1` but the <a id="bin-names-are-numbers">command somehow got the name `0`</a>:

``` bash
$ ls -l packages/scope1-test/node_modules/.bin/ | grep command1
lrwxrwxrwx 1 eric www 32 mars  11 17:25 0 -> ../../../scope1-cli/bin/command1
```

This is raised as [Lerna issue #1974](https://github.com/lerna/lerna/issues/1974). For now, we can force the correct name, but will have to do it every time lerna touches that repo:

``` bash
mv packages/scope1-test/node_modules/.bin/{0,command1}
```

Now that we have a short, predictable path to `command1`, we can create `packages/scope1-test/test/cli-test.js` to test that it can execute `command1`:

``` javascript
let child_process = require('child_process');

describe("The command1 script", function () {
  it("should see all", () => {
    return new Promise((resolve, reject) => {
      let program = child_process.spawn(__dirname + "/../node_modules/.bin/command1");
      let stdout = ""
      program.stdout.on("data", data => { stdout += data; });
      program.on("exit", exitCode => {
        setTimeout(
          () => resolve({stdout:stdout, exitCode:exitCode}), 0
        )
      })
      program.on("error", err => { reject(err); })
    }).then(result => {
      if (!result.stdout.includes("sees all"))
        throw new Error("saw " + JSON.stringify(result))
    })
  })
})
```

, run the test:

``` bash
(cd packages/scope1-test/ && npm test)
```

, and see encouraging output:

```
  The command1 script
    ✓ should see all (125ms)


  1 passing (132ms)
```

