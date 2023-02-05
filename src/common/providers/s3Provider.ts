import { Readable } from 'stream';
import { container } from 'tsyringe';
import { GetObjectCommand, GetObjectRequest, PutObjectCommand, PutObjectRequest, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { IConfigProvider, IData, IS3Config } from '../interfaces';
import { SERVICES } from '../constants';
import { AppError } from '../appError';

export class S3Provider implements IConfigProvider {
  private readonly s3: S3Client;
  private readonly logger: Logger;
  private readonly s3Config: IS3Config;

  public constructor() {
    this.logger = container.resolve(SERVICES.LOGGER);
    this.s3Config = container.resolve(SERVICES.S3);
    
    const s3ClientConfig: S3ClientConfig = {
      endpoint: this.s3Config.endpointUrl,
      forcePathStyle: this.s3Config.forcePathStyle,
      credentials: {
        accessKeyId: this.s3Config.accessKeyId,
        secretAccessKey: this.s3Config.secretAccessKey,
      },
    }

    this.s3 = new S3Client(s3ClientConfig);
  }

  public async getFile(filePath: string): Promise<IData> {
    
    /* eslint-disable @typescript-eslint/naming-convention */
    const getParams: GetObjectRequest = {
      Bucket: this.s3Config.bucket,
      Key: filePath,
    };
    /* eslint-enable @typescript-eslint/naming-convention */
    
    try {
      const response = await this.s3.send(new GetObjectCommand(getParams));
      if (response.$metadata.httpStatusCode != httpStatus.OK) {
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Didn't get the file ${filePath}`, false);
      }
      const data: IData = {
        content: response.Body as Readable,
        length: response.ContentLength
      }
      return data;

    } catch (e) {
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, "Didn't connect to S3", false);
    }
  }

  public async postFile(filePath: string, data: IData): Promise<void> {
    /* eslint-disable @typescript-eslint/naming-convention */
    const putParams: PutObjectRequest = {
      Bucket: this.s3Config.destinationBucket,
      Key: filePath,
      Body: data.content,
      ContentLength: data.length,
    };
    /* eslint-enable @typescript-eslint/naming-convention */
    try {
      const response = await this.s3.send(new PutObjectCommand(putParams));
      if (response.$metadata.httpStatusCode != httpStatus.OK) {
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Didn't write the file ${filePath} in S3`, false);
      }

    } catch (e) {
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, "Didn't connect to S3", false);
    }
  }
}
