// @flow
/* eslint require-jsdoc: 0 */

const { spawn } = require('child_process');
const fs = require('fs');
const { join } = require('path');

const packagesToLink = ['@cajacko/lib'];

const promisify = callback => arg =>
  new Promise((resolve, reject) => {
    try {
      callback(arg, (e, val) => {
        if (e) {
          reject(e);
          return;
        }

        resolve(val);
      });
    } catch (e) {
      reject(e);
    }
  });

const readFile = (...args) =>
  promisify(fs.readFile)(...args).then(contents => contents.toString());

const parseEnvFileToJSON = path =>
  readFile(path)
    .then(contents => {
      try {
        const envObj = {};
        const envContents = contents.toString();

        const lines = envContents.split('\n');

        lines.forEach(line => {
          const match = line.match(/(.*?)=(.*)/);

          if (!match) return;

          const [, key, value] = match;

          switch (value) {
            case 'true':
              envObj[key] = true;
              break;
            case 'false':
              envObj[key] = false;
              break;
            default:
              envObj[key] = value;
              break;
          }
        });

        return envObj;
      } catch (e) {
        return null;
      }
    })
    .catch(() => null);

const getEnv = () => {
  const env = {};

  const addContentsToEnv = contents => {
    if (!contents || typeof contents !== 'object') return;

    Object.keys(contents).forEach(key => {
      const val = contents[key];

      if (env[key] === undefined) {
        env[key] = val;
      }
    });
  };

  return parseEnvFileToJSON(join(__dirname, '../.env.local'))
    .then(addContentsToEnv)
    .then(() => addContentsToEnv(process.env))
    .then(() => parseEnvFileToJSON(join(__dirname, '../.env')))
    .then(addContentsToEnv)
    .then(() => env);
};

const getUseLocalLibs = () =>
  getEnv().then(env => {
    if (!env) return false;

    return !!env.USE_LOCAL_LIBS;
  });

const compose = (...filters) => value => {
  let newValue = value;

  filters.forEach(filter => {
    newValue = filter(newValue);
  });

  return newValue;
};

const removeNPMEnv = env => {
  const newEnv = {};

  Object.keys(env).forEach(key => {
    if (!key.includes('npm_')) {
      newEnv[key] = env[key];
    }
  });

  return newEnv;
};

const filterEnvPath = env => {
  const removeString = join(__dirname, '../node_modules/.bin');

  const newEnv = Object.assign({}, env);

  let path = newEnv.PATH;

  path = path.replace(`${removeString}:`, '');
  path = path.replace(removeString, '');

  newEnv.PATH = path;

  return newEnv;
};

const runCommand = (command, args) =>
  new Promise(resolve => {
    const env = compose(
      removeNPMEnv,
      filterEnvPath
    )(process.env);

    const ps = spawn(command, args, {
      stdio: 'inherit',
      env,
    });

    ps.on('close', code => {
      if (code) {
        process.exit(code);
      }

      resolve();
    });
  });

const getCommandToRun = useLocalLibs => {
  const index = process.argv
    .map((arg, i) => ({ arg, i }))
    .find(({ arg }) => arg.includes('scripts/template.js')).i;

  const args = process.argv.slice(index + 1);

  return useLocalLibs ? ['template', args] : ['npx', ['template'].concat(args)];
};

const loopPromise = promiseFuncs => {
  const vals = [];

  const loop = (i = 0) => {
    const promiseFunc = promiseFuncs[i];

    if (!promiseFunc) return Promise.resolve(vals);

    return promiseFunc().then(val => {
      vals.push(val);
      return loop(i + 1);
    });
  };

  return loop();
};

const getIsLinked = () =>
  loopPromise(
    packagesToLink.map(npmPackage => () => {
      const dir = join(__dirname, '../node_modules/', npmPackage);

      return promisify(fs.lstat)(dir)
        .then(stats => ({ npmPackage, isLinked: stats.isSymbolicLink() }))
        .catch(() => ({ npmPackage, isLinked: false }));
    })
  );

const unlink = () =>
  runCommand('rm', ['-rf', 'node_modules']).then(() => runCommand('yarn'));

const link = () =>
  loopPromise(
    packagesToLink.map(npmPackage => () =>
      runCommand('yarn', ['link', npmPackage])
    )
  );

const linkUnlink = (useLocalLibs, npmPackages) => {
  let areAllLinked = true;
  let areAllUnlinked = true;

  npmPackages.forEach(({ isLinked }) => {
    if (isLinked) {
      areAllUnlinked = false;
    } else {
      areAllLinked = false;
    }
  });

  if (!areAllUnlinked && !useLocalLibs) {
    return unlink();
  }

  if (!areAllLinked && useLocalLibs) {
    return link();
  }

  return Promise.resolve();
};

const buildLibs = () => runCommand('template', ['build:lib']);

const init = () =>
  getUseLocalLibs()
    .then(useLocalLibs =>
      getIsLinked().then(isLinked =>
        Promise.all([
          getCommandToRun(useLocalLibs),
          linkUnlink(useLocalLibs, isLinked),
          useLocalLibs ? buildLibs() : Promise.resolve(),
        ])
      )
    )
    .then(([command]) => runCommand(...command));

init();
