/**
 * Conversion d'un enregistrement (webm/opus du navigateur) en WAV PCM 16 bits, 16 kHz mono :
 * le format le plus largement accepté par les moteurs de reconnaissance.
 */
export const TARGET_RATE = 16000;

/** En-tête WAV + échantillons PCM 16 bits (valeurs attendues entre -1 et 1) */
export function encodeWav(samples: Float32Array, sampleRate = TARGET_RATE): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // taille du bloc fmt
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // octets par seconde
  view.setUint16(32, 2, true); // octets par échantillon
  view.setUint16(34, 16, true); // bits par échantillon
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((s, i) => {
    const clamped = Math.max(-1, Math.min(1, s));
    view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  });
  return buffer;
}

/** Enregistrement navigateur → WAV 16 kHz mono (navigateur uniquement : AudioContext) */
export async function toWav(recording: Blob): Promise<{ wav: Blob; durationMs: number }> {
  const decoded = await new AudioContext().decodeAudioData(await recording.arrayBuffer());
  const length = Math.ceil(decoded.duration * TARGET_RATE);
  const offline = new OfflineAudioContext(1, length, TARGET_RATE);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const rendered = await offline.startRendering();
  return {
    wav: new Blob([encodeWav(rendered.getChannelData(0))], { type: 'audio/wav' }),
    durationMs: Math.round(decoded.duration * 1000),
  };
}
