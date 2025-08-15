import { OpenAI } from 'openai';
import * as fs from 'fs';
import { Observable } from 'rxjs';

export interface StartEvent {
  type: 'start';
}

export interface PartialTextEvent {
  type: 'partialText';
  content: string;
}

export interface FullTextEvent {
  type: 'fullText';
  content: string;
}

export interface EndEvent {
  type: 'end';
}

export type TranscriptionEvent =
  | StartEvent
  | PartialTextEvent
  | FullTextEvent
  | EndEvent;

export interface TranscriptorOptions {
  apiKey: string;
}

export interface TranscribeOptions {
  file: string | fs.ReadStream;
  language?: string;
}

export class Transcriptor {
  private openai: OpenAI;

  constructor(options: TranscriptorOptions) {
    this.openai = new OpenAI({ apiKey: options.apiKey });
  }

  async transcribe(
    options: TranscribeOptions,
  ): Promise<Observable<TranscriptionEvent>> {
    let file;

    if (typeof options.file === 'string') {
      file = fs.createReadStream(options.file);
    } else {
      file = options.file;
    }

    const stream = await this.openai.audio.transcriptions.create({
      model: 'gpt-4o-transcribe',
      file,
      language: options.language ?? 'en',
      chunking_strategy: 'auto',
      stream: true,
    });

    return new Observable<TranscriptionEvent>((observer) => {
      let cancelled = false;

      observer.next({ type: 'start' });

      (async () => {
        for await (const event of stream) {
          if (cancelled) {
            return;
          }

          switch (event.type) {
            case 'transcript.text.delta':
              observer.next({ type: 'partialText', content: event.delta });
              break;
            case 'transcript.text.done':
              observer.next({ type: 'fullText', content: event.text });
              observer.next({ type: 'end' });
              break;
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    });
  }
}
