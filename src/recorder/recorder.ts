import * as fs from 'fs';
import * as os from 'os';
import * as crypto from 'crypto';
import { Lame } from 'node-lame';

import { encodeWav } from './wav';
import { AudioTee, AudioChunk } from '@/audiotee';

export class Recorder {
  private audiotee: AudioTee;
  private rawFilePath: string;
  private wavFilePath: string;
  private mp3FilePath: string;
  private recording = false;

  constructor() {
    const tempPath = os.tmpdir() + crypto.randomUUID();
    this.rawFilePath = tempPath + '.raw';
    this.mp3FilePath = tempPath + '.mp3';
    this.wavFilePath = tempPath + '.wav';
    this.audiotee = new AudioTee({
      sampleRate: 32000,
      mic: true,
    });
  }

  async start() {
    if (this.recording) {
      throw new Error('Recording in progress');
    }

    this.recording = true;
    const stream = fs.createWriteStream(this.rawFilePath);

    this.audiotee.on('data', (chunk: AudioChunk) => {
      stream.write(chunk.data);
    });

    this.audiotee.on('log', (msg: string) => {
      console.log(msg);
    });

    this.audiotee.on('stop', () => {
      stream.close();
    });

    await this.audiotee.start();
  }

  async stop() {
    if (!this.recording) {
      throw new Error('Recording stopped');
    }

    await this.audiotee.stop();
  }

  async getFile() {
    const buff = await fs.promises.readFile(this.rawFilePath);
    const wavBuff = encodeWav(buff, {
      numChannels: 1,
      sampleRate: 32000,
    });

    await fs.promises.writeFile(this.wavFilePath, wavBuff);

    const encoder = new Lame({
      output: this.mp3FilePath,
    }).setFile(this.wavFilePath);

    await encoder.encode();

    return fs.createReadStream(this.mp3FilePath);
  }
}
