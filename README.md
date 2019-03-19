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

# Publishing

As with other package management functions, Lerna can publish your packages, but it integrates management of git releases at the same time. The (interactive) `lerna publish` command publishes all known (i.e. reachable by the globs in `lerna.json`'s `packages` property.

Before publishing, you'll want to verify your login credentials. If you're using the npm repository, you can login in with `npm adduser` and verify your identity with `npm whoami`. If Lerna encounters an authentication problem during publishing, it will have already:

1. updated the `package.json` in all of the package directories.
2. committed that in a commit with the release name (e.g. "v0.1.0").
3. added a lightweight tag with the release name ("v0.1.0" again).
4. done a git push.

so if you want to try again with the same version, you will have to delete the tag (`git tag -d v0.1.0` and `git push --delete origin v0.1.0`) and hard-reset the commit (`git reset HEAD~1`).

The `version` property overrides the versions in the packages' `package.json` files. Starting from version 0.0.0, the first interaction prompts you for the version to publish. Here we select `0.1.0`

```
$ npx lerna publish
lerna notice cli v3.13.1
lerna info current version 0.0.0
lerna info Looking for changed packages since v0.9.0
? Select a new version (currently 0.0.0) (Use arrow keys)
  Patch (0.0.1) 
❯ Minor (0.1.0) 
  Major (1.0.0) 
  Prepatch (0.0.1-alpha.0) 
  Preminor (0.1.0-alpha.0) 
  Premajor (1.0.0-alpha.0) 
  Custom Prerelease 
  Custom Version 
```

It then lists the packages to be published and asks for confirmation:

```
? Select a new version (currently 0.0.0) Minor (0.1.0)

Changes:
 - furk: 0.0.0-development => 0.1.0 (private)
 - @shex/extension-map: 0.1.0 => 0.1.0
 - @shex/extension-test: 0.1.0 => 0.1.0
 - shape-map: 0.1.0 => 0.1.0
 - @shex/cli: 0.1.0 => 0.1.0
 - @shex/core: 0.0.0 => 0.1.0
 - @shex/loader: 0.1.1 => 0.1.0
 - @shex/parser: 0.0.9 => 0.1.0
 - @shex/webapp: 0.1.0 => 0.1.0

? Are you sure you want to publish these packages? (ynH) 
```

Here we see that it overrides versions in package.json, even if they are later versions. In fact, lerna will write the master version number into each `package.json`.
