import { sync as resolveBin } from 'resolve-bin';
import { fork } from 'child_process';
import { join, dirname } from 'path';
import Copyfile from './copyfile';
import { IApi, IBundleOptions } from '../..';
type buildType = 'cjs' | 'esm';

export default class Babel {
  private cwd: string;
  private babel: string;
  private babelRc: string;
  private input: string;
  private options: IBundleOptions;

  constructor(api: IApi, options: IBundleOptions) {
    const { input = 'src/index.js' } = options;
    this.options = options;
    this.cwd = api.cwd || process.cwd();
    this.babel = resolveBin('@babel/cli', { executable: 'babel' });
    this.babelRc = join(__dirname, 'babel.config');
    this.input = dirname(join(this.cwd, input));
  }

  public async build() {
    const { cjs, esm } = this.options;
    const copy = new Copyfile(this.input, this.cwd);
    if (cjs && cjs.type === 'babel') {
      const dir = 'lib'; // not support dir yet, need pass config to file
      await this.complie(dir, 'cjs');
      await copy.run(dir);
      // tslint:disable-next-line
      console.log('babel complie cjs done');
    }
    if (esm && esm.type === 'babel') {
      const dir = 'es';
      await this.complie(dir, 'esm');
      await copy.run(dir);
      // tslint:disable-next-line
      console.log('babel complie esm done');
    }
  }

  private async complie(dir: string, type: buildType): Promise<boolean> {
    return new Promise(resolve => {
      const child = fork(
        this.babel,
        ['--config-file', this.babelRc, this.input, '--out-dir', dir],
        {
          env: {
            BABEL_ENV: type,
          },
        }
      );
      child.on('exit', () => {
        resolve(true);
      });
    });
  }
}
