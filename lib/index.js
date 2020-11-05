const { spawn, exec } = require('child_process');
const { getFinishedLog, getLoadingLog, getCrashedLog } = require('./logs');
const { getDockerRunCommand, getDockerStopCommand } = require('./commands');
const { reloadTrigger } = require('./reload-trigger');

module.exports = class PlatformBuildWithWatchPlugin {
  // constructor({ withoutDockerRun, customCallbackOnBuild }) {
  // this.withoutDockerRun = withoutDockerRun;
  // this.customCallbackOnBuild = customCallbackOnBuild;
  // }

  handlerModulesBuild() {
    // if (this.customCallbackOnBuild) {
    //   this.customCallbackOnBuild();

    //   return;
    // }

    // if (!this.withoutDockerRun) {
    const child = spawn('docker', [getDockerRunCommand()], {
      shell: true,
      detached: true,
      // to get REAL logs replace comments and remove child
      // stdio: 'inherit',
    });

    child.stdout.on('end', () => {
      getFinishedLog();
      reloadTrigger();
    });

    child.on('error', error => () => getCrashedLog(error));
    // }
  }

  handleBuildEnvs() {
    exec(
      'rm -fr $(pwd)/build/runtime-config.js && bash $(pwd)/config/deploy/runtime-envs/development/make-runtime-config-local.sh',
      {
        shell: true,
      },
    );
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('CustomPlugin', compilation => {
      compilation.hooks.needAdditionalPass.tap(
        'CustomPlugin',
        this.handlerModulesBuild,
      );

      compilation.hooks.needAdditionalPass.tap(
        'HandleBuildEnvs',
        this.handleBuildEnvs,
      );
    });

    compiler.plugin('beforeCompile', () => {
      getLoadingLog();

      exec(
        getDockerStopCommand(),
        {
          shell: true,
        },
        // to get REAL logs replace comments
        // (error, output) => console.log(output),
      );
    });
  }
};
