import { inject, injectable } from 'tsyringe';
import config from 'config';
import { Logger } from '@map-colonies/js-logger';
import { ITaskResponse, IUpdateJobBody, IUpdateTaskBody, JobManagerClient, OperationStatus } from '@map-colonies/mc-priority-queue';
import httpStatus from 'http-status-codes';
import { SERVICES } from '../common/constants';
import { IJobParameters, ITaskParameters } from '../common/interfaces';
import { AppError } from '../common/appError';

@injectable()
export class JobManagerWrapper extends JobManagerClient {
  // private readonly tilesJobType: string;
  // private readonly tilesTaskType: string;
  // private readonly expirationDays: number;

  public constructor(@inject(SERVICES.LOGGER) protected readonly logger: Logger) {
    super(
      logger,
      config.get<string>('worker.jobType'),
      config.get<string>('worker.taskType'),
      config.get<string>('jobManager.url')
    );
    // this.tilesJobType = config.get<string>('worker.jobType');
    // this.tilesTaskType = config.get<string>('worker.taskType');
  }

  public async startTask(): Promise<ITaskResponse<ITaskParameters> | null> {
    try {
      const task  = await this.consume<ITaskParameters>();
      return task;
    } catch(err) {
      this.logger.error({ msg: err });
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Problem with jobManager. Didn't get task to work on`, false);
    }
  }

  public async completeTask(task: ITaskResponse<ITaskParameters>): Promise<void> {
    if(task.jobId == undefined) {
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Somehow task ${task.id} doesn't contain jobId`, false);
    }
    const jobId = task.jobId;
    const taskId= task.id;
    const payload: IUpdateTaskBody<ITaskParameters> = {
      status: OperationStatus.COMPLETED,
      percentage: 100,
    }
    try {
      await this.updateTask(jobId, taskId, payload);
      return;
    } catch(err) {
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Problem with jobManager. Didn't update task to completed`, false);
    }
  }

  public async progressJob(jobId: string | undefined): Promise<boolean> {
    let isJobCompelted = false;
    if(jobId == undefined) {
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Somehow jobId is undefined`, false);
    }
    try {
      const job  = await this.getJob(jobId);
      if(job == undefined) {
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Somehow job ${jobId} doesn't exists anymore`, false);
      }

      const payload: IUpdateJobBody<IJobParameters> = {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        percentage: parseInt((job.completedTasks/job.taskCount*100).toString())
      };

      if (job.taskCount == job.completedTasks) {
        payload.status = OperationStatus.COMPLETED;
        isJobCompelted = true;
      }

      await this.updateJob<IJobParameters>(jobId, payload);

      return isJobCompelted;

    } catch(err) {
      this.logger.error({ msg: err });
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Problem with jobManager. Didn't get task to work on`, false);
    }
  }
}
