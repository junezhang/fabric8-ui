import {
  ViewEncapsulation, Component, Inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild,
  Host
} from '@angular/core';
//
import { ILoggerDelegate, LoggerFactory } from '../../common/logger';
import { INotifyPropertyChanged } from '../../core/component';
import { IWorkflow, WorkflowTransitionAction } from '../../models/workflow';
import { Fabric8AppGeneratorClient } from '../../services/fabric8-app-generator.client';
import {WizardComponent, WizardConfig, WizardEvent, WizardStepConfig} from 'patternfly-ng';
import {SpaceWizardComponent} from '../../space-wizard.component';

@Component({
  host: {
   'class': 'wizard-step'
  },
  // ensure that dynamically added html message get styles applied
  encapsulation: ViewEncapsulation.None,

  selector: 'forge-app-generator',
  templateUrl: './forge-app-generator.component.html',
  styleUrls: [ './forge-app-generator.component.less' ],
  providers: [
    Fabric8AppGeneratorClient.factoryProvider
  ]
})
export class ForgeAppGeneratorComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('wizard') wizard: WizardComponent;
  // Wizard
  wizardConfig: WizardConfig;
  spaceWizard: SpaceWizardComponent;

  // keep track of the number of instances
  static instanceCount: number = 1;

  @Input() title: string = 'Forge Wizard'; // default title
  @Input() workflowStepName: string = '';
  @Input() forgeCommandName: string = 'none';
  @Input() workflow: IWorkflow;
  stepConfig: WizardStepConfig;

  constructor(
    public appGenerator: Fabric8AppGeneratorClient,
    loggerFactory: LoggerFactory,
    @Host() spaceWizard: SpaceWizardComponent) {
    let logger = loggerFactory.createLoggerDelegate(this.constructor.name, ForgeAppGeneratorComponent.instanceCount++);
    if ( logger ) {
      this.log = logger;
    }
    this.spaceWizard = spaceWizard;
    this.log(`New instance ...`);
  }

  /**
   * All inputs are bound and values assigned, but the 'workflow' get a new instance every time the parents host dialog
   * is opened.
   */
  ngOnInit() {
    this.log(`ngOnInit ...`);
    this.appGenerator.commandName = this.forgeCommandName;
    this.appGenerator.workflow = this.workflow;

    ///// Wizard
    this.wizardConfig = {
      title: this.title,
      // sidebarStyleClass: 'example-wizard-sidebar',
      // stepStyleClass: 'example-wizard-step'
    } as WizardConfig;
    this.stepConfig = {
      id: 'step1',
      priority: 0,
      title: 'First Step'
    } as WizardStepConfig;
    ///// Wizard
  }

  nextClicked($event: WizardEvent): void {
    if ($event.step.config.id === 'step3b') { // TODO test final step
      this.spaceWizard.finish();
    }
  }

  ngOnDestroy() {
    this.log(`ngOnDestroy ...`);
  }

  /** handle all changes to @Input properties */
  ngOnChanges(changes: SimpleChanges) {
    for ( let propName in changes ) {
      if ( changes.hasOwnProperty(propName) ) {
        this.log(`ngOnChanges ... ${propName}`);
        switch ( propName.toLowerCase() ) {
          case 'workflow': {
            let change: INotifyPropertyChanged<IWorkflow> = <any>changes[ propName ];
            this.onWorkflowPropertyChanged(change);
            break;
          }
          default : {
            break;
          }
        }
      }
    }
  }

  private onWorkflowPropertyChanged(change?: INotifyPropertyChanged<IWorkflow>) {
    if ( change ) {
      if ( change.currentValue !== change.previousValue ) {
        this.log(`The workflow property changed value ...`);
        let current: IWorkflow = change.currentValue;
        this.appGenerator.workflow = current;
        this.subscribeToIncomingWorkflowTransitions(current);
        this.subscribeToOutgoingWorkflowTransitions(current);
      }
    }
  }
  private subscribeToOutgoingWorkflowTransitions(workflow: IWorkflow) {
    if ( !workflow ) {
      return;
    }
    workflow.transitions.filter(transition => transition.isTransitioningFrom(this.workflowStepName))
    .subscribe((transition) => {
      switch ( transition.action ) {
        case WorkflowTransitionAction.NEXT: {
          // moving from this point in the workflow as the result of a nextStep transition
          break;
        }
        case WorkflowTransitionAction.GO: {
          // moving from this point in the workflow as the result of a goToStep transition
          break;
        }
        default: {
          break;
        }
      }
    });
  }

  private subscribeToIncomingWorkflowTransitions(workflow: IWorkflow) {
    if ( !workflow ) {
      return;
    }
    workflow.transitions.filter(transition => transition.isTransitioningTo(this.workflowStepName))
    .subscribe((transition) => {
      this.appGenerator.begin();
    });
  }

  /** logger delegate delegates logging to a logger */
  private log: ILoggerDelegate = () => {};

}
