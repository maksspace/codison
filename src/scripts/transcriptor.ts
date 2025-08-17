import { Transcriptor } from '@/transcriptor';
import { Recorder } from '@/recorder';

(async () => {
  // stream.subscribe({
  //   next: (event) => {
  //     console.log(event);
  //   },
  // });
  // const audiotee = new AudioTee({ sampleRate: 16000, chunkDuration: 0.05 });
  // let buff = Buffer.alloc(0);
  // audiotee.on('data', (chunk: AudioChunk) => {
  //   console.log({ chunk });
  //   const g: any = {};
  //   chunk.data.forEach((v) => {
  //     if (!g[v]) {
  //       g[v] = 1;
  //     } else {
  //       g[v] += 1;
  //     }
  //   });
  //   console.log(g);
  //   buff = Buffer.concat([buff, chunk.data]);
  //   // console.log(buff);
  //   // chunk.data contains a raw PCM chunk of captured system audio
  // });
  // audiotee.on('log', (log) => {
  //   console.log(log);
  // });
  // audiotee.on('error', (err) => {
  //   console.log(err);
  // });
  // await audiotee.start().then(() => {
  //   setTimeout(async () => {
  //     await audiotee.stop();
  //     const l = encodeWav(buff, {
  //       numChannels: 1,
  //       sampleRate: 16000,
  //       byteRate: 16,
  //     });
  //     fs.writeFileSync('./test.wav', l);
  //   }, 15000);
  // });
  // const audiotee = new AudioTee({ sampleRate: 16000 });
  // audiotee.on('data', (chunk: AudioChunk) => {
  //   console.log(chunk);
  //   // chunk.data contains a raw PCM chunk of captured system audio
  // });
  // await audiotee.start();

  const transcriptor = new Transcriptor({
    apiKey: process.env['OPENAI_API_KEY'],
  });

  const recorder = new Recorder();
  recorder.start();

  setTimeout(async () => {
    await recorder.stop();

    const mp3 = await recorder.getFile();
    const stream = await transcriptor.transcribe({
      file: mp3,
      language: 'en',
    });

    stream.subscribe({
      next: (event) => {
        console.log(event);
      },
    });
  }, 30000);
})();
