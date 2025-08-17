import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import path, { join } from 'path';
import type { AudioTeeOptions, LogMessage, AudioTeeEvents } from './types.js';
import { fileURLToPath } from 'url';

let dirname: string;

if (typeof module === 'undefined' && typeof exports === 'undefined') {
  dirname = path.dirname(fileURLToPath(import.meta.url));
} else {
  dirname = __dirname;
}

// FIXME: not emitting start, stop, or any events really
export class AudioTee {
  private events = new EventEmitter();
  private process: ChildProcess | null = null;
  private isRunning = false;
  private options: AudioTeeOptions;

  constructor(options: AudioTeeOptions = {}) {
    this.options = options;
  }

  on<K extends keyof AudioTeeEvents>(
    event: K,
    listener: AudioTeeEvents[K],
  ): this {
    this.events.on(event, listener);
    return this;
  }

  once<K extends keyof AudioTeeEvents>(
    event: K,
    listener: AudioTeeEvents[K],
  ): this {
    this.events.once(event, listener);
    return this;
  }

  off<K extends keyof AudioTeeEvents>(
    event: K,
    listener: AudioTeeEvents[K],
  ): this {
    this.events.off(event, listener);
    return this;
  }

  removeAllListeners<K extends keyof AudioTeeEvents>(event?: K): this {
    this.events.removeAllListeners(event);
    return this;
  }

  private emit<K extends keyof AudioTeeEvents>(
    event: K,
    ...args: Parameters<AudioTeeEvents[K]>
  ): boolean {
    return this.events.emit(event, ...args);
  }

  private buildArguments(): string[] {
    const args: string[] = [];

    if (this.options.sampleRate !== undefined) {
      args.push('--sample-rate', this.options.sampleRate.toString());
    }

    if (this.options.chunkDuration !== undefined) {
      args.push('--chunk-duration', this.options.chunkDuration.toString());
    }

    if (this.options.mute) {
      args.push('--mute');
    }

    if (
      this.options.includeProcesses &&
      this.options.includeProcesses.length > 0
    ) {
      args.push(
        '--include-processes',
        ...this.options.includeProcesses.map((p) => p.toString()),
      );
    }

    if (
      this.options.excludeProcesses &&
      this.options.excludeProcesses.length > 0
    ) {
      args.push(
        '--exclude-processes',
        ...this.options.excludeProcesses.map((p) => p.toString()),
      );
    }

    if (this.options.mic) {
      args.push('--mic');
    }

    return args;
  }

  private handleStderr(data: Buffer): void {
    const text = data.toString('utf8');
    const lines = text.split('\n').filter((line) => line.trim());

    for (const line of lines) {
      try {
        const logMessage: LogMessage = JSON.parse(line);
        this.emit('log', logMessage.data.message, logMessage.message_type);

        // TODO: support metadata, too
        if (logMessage.message_type === 'stream_start') {
          this.emit('start');
        } else if (logMessage.message_type === 'stream_stop') {
          this.emit('stop');
        } else if (logMessage.message_type === 'error') {
          this.emit('error', new Error(logMessage.data.message));
        }
      } catch (parseError) {
        // TODO: handle this
      }
    }
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isRunning) {
        reject(new Error('AudioTee is already running'));
        return;
      }

      const binaryPath = join(dirname, '..', '..', 'bin', 'audiotee');
      const args = this.buildArguments();

      this.process = spawn(binaryPath, args);

      this.process.on('error', (error) => {
        this.isRunning = false;
        this.emit('error', error);
        reject(error);
      });

      this.process.on('exit', (code, signal) => {
        this.isRunning = false;
        if (code !== 0 && code !== null) {
          const error = new Error(`AudioTee process exited with code ${code}`);
          this.emit('error', error);
        }
      });

      this.process.stdout?.on('data', (data: Buffer) => {
        this.emit('data', { data: data });
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        this.handleStderr(data);
      });

      this.isRunning = true;
      resolve();
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isRunning || !this.process) {
        resolve();
        return;
      }

      // Force kill after 5 seconds if process doesn't respond
      const timeout = setTimeout(() => {
        if (this.process && this.isRunning) {
          this.process.kill('SIGKILL');
        }
      }, 5000);

      this.process.once('exit', () => {
        clearTimeout(timeout);
        this.isRunning = false;
        this.process = null;
        resolve();
      });

      this.process.kill('SIGTERM');
    });
  }

  isActive(): boolean {
    return this.isRunning;
  }
}
