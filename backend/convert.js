const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Function to check if a file has an image extension
function hasImageExtension(filename) {
    const ext = path.extname(filename).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.tiff', '.svg'].includes(ext);
}

// Function to get the hash of a file
function getFileHash(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        const stream = fs.createReadStream(filePath);

        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}

// Function to rename files
async function renameFiles(dir) {
    fs.readdir(dir, async (err, files) => {
        if (err) {
            console.error(`Error reading directory: ${err.message}`);
            return;
        }

        const fileHashes = new Map();
        let index = 1;

        for (const file of files) {
            const filePath = path.join(dir, file);

            try {
                const stats = await fs.promises.stat(filePath);

                if (stats.isFile()) {
                    const fileHash = await getFileHash(filePath);

                    if (fileHashes.has(fileHash)) {
                        console.log(`Duplicate found: ${filePath} (deleting)`);
                        await fs.promises.unlink(filePath);
                    } else {
                        fileHashes.set(fileHash, filePath);

                        const ext = hasImageExtension(file) ? path.extname(file) : '.png';
                        const newFileName = `corcor${index}${ext}`;
                        const newFilePath = path.join(dir, newFileName);
                        
                        await fs.promises.rename(filePath, newFilePath);
                        console.log(`Renamed ${filePath} to ${newFilePath}`);
                        index++;
                    }
                }
            } catch (error) {
                console.error(`Error processing file: ${error.message}`);
            }
        }
    });
}

// Example usage
const directoryPath = './test'; // Replace with your directory path
renameFiles(directoryPath);
