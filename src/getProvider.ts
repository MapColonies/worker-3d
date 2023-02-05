// import { FSProvider } from './common/providers/fSProvider';
import { S3Provider } from './common/providers/s3Provider';
import { IConfigProvider } from './common/interfaces';
import { FSProvider } from './common/providers/fSProvider';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const getProvider = (provider: string): IConfigProvider => {
  switch (provider.toLowerCase()) {
    case 'fs':
      return new FSProvider();
    case 's3':
      return new S3Provider();
    default:
      throw new Error(`Invalid config provider received: ${provider} - available values:  "fs" or "s3"`);
  }
};
