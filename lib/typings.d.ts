declare const global: unknown;

interface GoInstance {
  run(instance: WebAssembly.Instance): Promise<void>;
  importObject: WebAssembly.Imports;
  argv?: string[];
}
