import axios from 'axios';
import { injectable, inject } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { IConfig } from 'config';
import { ITaskResponse } from '@map-colonies/mc-priority-queue';
import httpStatus from 'http-status-codes';
import { SERVICES } from '../common/constants';
import { IConfigProvider } from '../common/interfaces';
import { JobManagerWrapper } from '../clients/jobManagerWrapper';
import { sleep } from '../common/utils';

@injectable()
export class WorkerManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    @inject(JobManagerWrapper) private readonly jobManagerClient: JobManagerWrapper,
    @inject(SERVICES.CONFIGPROVIDER) private readonly configProvider: IConfigProvider
    ) {}
  public async worker(): Promise<void> {
    
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-constant-condition
    while(true) {
      const task = await this.jobManagerClient.startTask();

      if(task == null) {
        await sleep(this.config.get<number>("worker.waitTime"));
        continue;
      }
      
      const files: string[] = task.parameters.paths;
      const taskLength = files.length;
      files.map(async (file: string) => {
        const data = await this.configProvider.getFile(file);
        await this.configProvider.postFile(file, data);
      });
      await this.jobManagerClient.completeTask(task);
      await this.jobManagerClient.progressJob(task.jobId);
    }
  }
}
