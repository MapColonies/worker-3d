import { Logger } from '@map-colonies/js-logger';
import { inject, singleton } from 'tsyringe';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { Argv } from 'yargs';
import { SERVICES } from './common/constants';
import { SayCommand } from './sayCommand/sayCommand';
import { registerExternalValues, RegisterOptions } from './containerConfig';
import { HelloWorldCommand } from './helloWorldCommand/helloWorldCommand';
import { WorkerManager } from './workerManager/workerManager';

@singleton()
export class App {

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    private readonly sayCommand: SayCommand,
    private readonly helloWorldCommand: HelloWorldCommand,
    private readonly workerManager: WorkerManager
  ) {
    workerManager.worker();
  }
}

export function getApp(registerOptions?: RegisterOptions): App {
  const container = registerExternalValues(registerOptions);
  const app = container.resolve(App);
  return app;
}
