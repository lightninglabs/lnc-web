import fs from 'fs';
import glob from 'glob';
import os from 'os';
import readline from 'readline';

/**
 * Read the generated rpc types and remove
 * 'List' from all Array type names.
 * More info:
 * https://github.com/improbable-eng/ts-protoc-gen/issues/86
 * https://github.com/protocolbuffers/protobuf/issues/4518
 */

const files = glob.sync('lib/types/generated/**/*.ts');
files.forEach((file, i) => {
    const tempFile = `lib/types/generated/temp-${i}.d.ts`;

    const reader = readline.createInterface({
        input: fs.createReadStream(file)
    });
    const writer = fs.createWriteStream(tempFile, {
        flags: 'a'
    });

    reader.on('line', (line) => {
        if (/List.*Array<.*>,/.test(line)) {
            writer.write(line.replace('List', ''));
        } else if (/Map.*Array<.*>,/.test(line)) {
            writer.write(line.replace('Map', ''));
        } else {
            writer.write(line);
        }
        writer.write(os.EOL);
    });

    reader.on('close', () => {
        writer.end();

        fs.renameSync(tempFile, file);
    });
});
