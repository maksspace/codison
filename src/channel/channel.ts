import { Observable, Subject, Subscription } from 'rxjs';
import { AgentEvent, RunAgentOptions } from '../agent/types';
import { Agent } from '../agent/agent';

export class Channel {
  public readonly input$ = new Subject<RunAgentOptions>();
  public readonly output$: Observable<AgentEvent>;

  private outputSubject = new Subject<AgentEvent>();

  private inputSub!: Subscription;
  private runSub?: Subscription;

  constructor(private agent: Agent) {
    this.output$ = this.outputSubject.asObservable();
    this.inputSub = this.input$.subscribe((input) => {
      const run$ = this.agent.run(input);
      this.runSub = run$.subscribe({
        next: (event) => this.outputSubject.next(event),
        error: (err) => this.outputSubject.error(err),
      });
    });
  }

  public stop(): void {
    this.inputSub.unsubscribe();
    this.input$.complete();
    this.outputSubject.complete();
    if (this.runSub) {
      this.runSub.unsubscribe();
    }
  }
}
