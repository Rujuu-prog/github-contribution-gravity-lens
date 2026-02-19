declare module 'gif-encoder-2' {
  class GIFEncoder {
    constructor(width: number, height: number, algorithm?: string, useOptimizer?: boolean);
    setDelay(delay: number): void;
    setRepeat(repeat: number): void;
    setQuality(quality: number): void;
    start(): void;
    addFrame(ctx: unknown): void;
    finish(): void;
    out: {
      getData(): Buffer;
    };
  }
  export default GIFEncoder;
}
