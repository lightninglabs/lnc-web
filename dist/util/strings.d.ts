export declare const capitalize: (s: string) => string;
/**
 * converts a hex string into base64 format
 */
export declare const b64: (value: string, reverse?: boolean) => string;
/**
 * Converts a mapping of class names -> bool to a string containing each key where the
 * value is truthy
 */
export declare const cn: (classNames: Record<string, boolean | undefined>) => string;
