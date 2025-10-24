import {Configuration} from "./interfaces";
import fs from 'fs/promises';
import * as path from "node:path";
import * as os from "node:os";

export async function getAccessConfigurations(file: string): Promise<Configuration[]> {
    const homeDir = os.homedir();

    const filePath = path.resolve(file || path.join(homeDir, '.aws/credentials'));
    console.log(`Using config file: ${filePath}`);

    const fileContent = await getFile(filePath);
    const lines = fileContent.split('\n').filter(line => line.trim().length > 0);
    const configs: Configuration[] = [];

    for (let i = 0; i < lines.length; i = i + 2) {
        let accessKeyId: string;
        let secretAccessKey: string;

        const [accessKey, accessKeyValue] = lines[i].split('=');
        const [secretKey, secretKeyValue] = lines[i + 1].split('=');

        if (accessKey.toLowerCase() == 'aws_access_key_id') {
            accessKeyId = accessKeyValue;
        } else {
            console.warn(`Unknown key: ${accessKey}`);
            continue;
        }

        if (secretKey.toLowerCase() == 'aws_secret_access_key') {
            secretAccessKey = secretKeyValue;
        } else {
            console.warn(`Unknown key: ${secretKey}`);
            continue;
        }

        configs.push({
            accessKeyId,
            secretAccessKey,
        });
    }

    return configs;
}

async function getFile(file: string) {
    const data = await fs.readFile(file, 'utf8');
    return data.replace(/\r/g, '');
}