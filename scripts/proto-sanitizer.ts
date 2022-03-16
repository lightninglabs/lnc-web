import fs from 'fs';
import glob from 'glob';
import os from 'os';
import path from 'path';
import readline from 'readline';

/**
 * The intended use of this program is to
 * to read target proto files and sanitize them
 * before typescript definitions are generated.
 * ie. uint64 values can overflow Number types
 * --> add a tag jstype = JS_STRING to cast to string
 */

if (!process.argv[2]) {
    throw new Error(
        'Usage: ts-node scripts/proto-sanitizer.ts' +
            './file.proto (globs accepted)'
    );
}

const readFiles = glob.sync(process.argv[2]);

for (const file of readFiles) {
    const writeFile = path.basename(file);

    const reader = readline.createInterface({
        input: fs.createReadStream(file)
    });
    const writer = fs.createWriteStream(writeFile, {
        flags: 'a'
    });
    const payload = 'jstype = JS_STRING';
    reader.on('line', (line) => {
        if (/^\s*u?int64.*$/.test(line)) {
            if (/^.*];$/.test(line)) {
                // existing tag
                writer.write(line.replace(/\s*];$/, `, ${payload}];`));
            } else {
                writer.write(line.replace(/;$/, ` [${payload}];`));
            }
        } else {
            writer.write(line);
        }
        writer.write(os.EOL);
    });
    reader.on('close', () => {
        writer.end();
    });
}
