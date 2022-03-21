export const capitalize = (s: string) => s && s[0].toUpperCase() + s.slice(1);

/**
 * converts a hex string into base64 format
 */
export const b64 = (value: string, reverse = false): string => {
    let converted = Buffer.from(value, 'hex');
    if (reverse) converted = converted.reverse();
    return converted.toString('base64');
};

/**
 * Converts a mapping of class names -> bool to a string containing each key where the
 * value is truthy
 */
export const cn = (classNames: Record<string, boolean | undefined>): string => {
    return Object.keys(classNames)
        .reduce<string[]>(
            (names, key) => (classNames[key] ? [...names, key] : names),
            []
        )
        .join(' ');
};
