import {
  appendFile,
  mkdir,
  readdir,
  unlink,
  rmdir,
  readFile,
} from 'fs/promises';
import { openSync, closeSync, existsSync } from 'fs';
import { join } from 'path';

export default class FsHandler {
  private outputFolder: string;
  public videoFilename: string;
  public imagesPath: string;
  // public imagesFilename: string;

  async init(outputFolder, filename = '') {
    this.outputFolder = outputFolder;
    this.videoFilename = join(
      this.outputFolder,
      (filename ? filename : Date.now()) + '.mp4',
    );
    this.imagesPath = join(this.outputFolder, 'images');
    // this.imagesFilename = join(this.outputFolder, 'images.txt');
    await this.verifyPathExists(this.outputFolder);
    await this.verifyPathExists(this.imagesPath);
    // await this.createEmptyFile(this.imagesFilename);
    await this.clearImagesInPath(this.imagesPath);
  }

  createEmptyFile(filename) {
    return closeSync(openSync(filename, 'w'));
  }

  createPath(pathToCreate, type = 'folder') {
    if (type === 'folder') return mkdir(pathToCreate);
    return this.createEmptyFile(pathToCreate);
  }

  verifyPathExists(pathToVerify, type = 'folder') {
    return existsSync(pathToVerify) || this.createPath(pathToVerify, type);
  }

  static ensurePathExists(pathToVerify) {
    return existsSync(pathToVerify) || mkdir(pathToVerify);
  }

  static verifyFileExists(path) {
    return existsSync(path);
  }

  appendToFile(filename, data) {
    return appendFile(filename, data);
  }

  async clearImagesInPath(imagesPath) {
    const files = await readdir(imagesPath);
    console.log(`Removing files in ${imagesPath}`);
    console.log(`Recorder ${files.length} frames`);
    for (const file of files) {
      const filename = join(imagesPath, file);
      // console.log(`Removing file ${filename}`);
      await unlink(filename);
    }
  }
  async clearImages() {
    await this.clearImagesInPath(this.imagesPath);
    await rmdir(this.imagesPath);
    // await unlink(this.imagesFilename);
  }

  static async readJSONFile(pathToFile: string) {
    let res;
    try {
      res = await readFile(pathToFile);
      res = await JSON.parse(res);
    } catch (e) {
      return null;
    }
    return res;
  }
}
