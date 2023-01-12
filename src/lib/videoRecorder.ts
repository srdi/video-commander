import FsHandler from './handlers/FsHandler';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as PuppeteerMassScreenshots from 'puppeteer-mass-screenshots';
// import PuppeteerMassScreenshots from './massRecorder';
const promisifiedExec = promisify(exec);

export default class PuppeteerVideoRecorder {
  private screenshots;
  private fsHandler;
  private page;
  private outputFolder;

  constructor() {
    // this.screenshots = new PuppeteerMassScreenshots();
    this.fsHandler = new FsHandler();
  }

  async init({ outputFolder, filename }) {
    console.log(`init videoRecorder ${outputFolder} ${filename}`);
    // this.page = page;
    this.outputFolder = outputFolder;
    await this.fsHandler.init(outputFolder, filename);
    // const { imagesPath, imagesFilename, appendToFile } = this.fsHandler;
    // await this.screenshots.init(page, imagesPath, {
    //   afterWritingImageFile: (filename) =>
    //     appendToFile(imagesFilename, `file '${filename}'\n`),
    // });
  }

  start(options = {}) {
    return this.screenshots.start(options);
  }

  async stop(ffmpegCommand = '') {
    await this.screenshots.stop();
    return await this.createVideo(ffmpegCommand);
  }

  // get defaultFFMpegCommand() {
  //   const { imagesFilename, videoFilename } = this.fsHandler;
  //   return [
  //     'ffmpeg',
  //     '-r 30',
  //     '-f concat',
  //     '-safe 0',
  //     '-y',
  //     `-i ${imagesFilename}`,
  //     videoFilename,
  //   ].join(' ');
  // }
  get defaultFFMpegCommand() {
    const { imagesPath, videoFilename } = this.fsHandler;
    return [
      'ffmpeg',
      '-r 60',
      '-pattern_type glob',
      '-y',
      `-i "${imagesPath}/*.png"`,
      '-c:v libx264',
      '-pix_fmt yuv420p',
      videoFilename,
    ].join(' ');
  }

  async createVideo(ffmpegCommand = '') {
    const _ffmpegCommand = ffmpegCommand || this.defaultFFMpegCommand;
    console.log(`launch ffmpegCommand ${_ffmpegCommand}`);
    const res = await promisifiedExec(_ffmpegCommand);
    // await this.fsHandler.clearImages();
    return res;
  }
}
