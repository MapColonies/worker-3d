import * as fs from 'fs';
import { Readable } from 'stream';
import { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { container } from 'tsyringe';
import config from 'config';
import { SERVICES } from '../constants';
import { IConfigProvider, FSConfig, IData } from '../interfaces';
import { AppError } from '../appError';

export class FSProvider implements IConfigProvider {
    private readonly logger: Logger;
    private readonly config: FSConfig;

  public constructor(){
    this.logger = container.resolve(SERVICES.LOGGER);
    this.config = config.get<FSConfig>("FS"); 
  }

  public async getFile(filePath: string): Promise<IData> {
    
    const fullPath = `${this.config.source.pvPath}/${filePath}`;
    if (!fs.existsSync(fullPath)) {
      throw new AppError('', httpStatus.BAD_REQUEST, `File ${filePath} doesn't exists in the agreed folder`, false);
    }
    
    const response: Readable = Readable.from(await fs.promises.readFile(fullPath));
    
    const data: IData = {
      content: response,
      length: response.readableLength
    }
    return data;
  }

  public async postFile(filePath: string, data: IData): Promise<void> {

    const fullPath = `${this.config.destination.pvPath}/${filePath}`;

    // Create a Readable stream
    const stream = new Readable();
    stream.push(data);
    stream.push(null);
    
    // Convert the readable stream to a string
    let fileBuffered = '';

    try {

      stream.on('data', (chunk: string) => {
        fileBuffered += chunk;
      });
      stream.on('end', ()=>{
        this.logger.info({ msg: 'finished converting to buffer '})
      });

      await fs.promises.writeFile(fullPath, fileBuffered);

      return;

    } catch(err) {
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Didn't write the file ${filePath} in FS`, false);
    }
  }
}
