import {
  ViewEncapsulation, Component, Inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild,
  Host, Output, EventEmitter} from '@angular/core';
import { ILoggerDelegate, LoggerFactory } from '../../common/logger';
import { Fabric8AppGeneratorClient } from '../../services/fabric8-app-generator.client';
import { WizardComponent, WizardConfig, WizardEvent, WizardStepConfig } from 'patternfly-ng';
import { SpaceWizardComponent } from '../../space-wizard.component';

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
export class ForgeAppGeneratorComponent implements OnInit, OnDestroy {
  @ViewChild('wizard') wizard: WizardComponent;
  // Wizard
  wizardConfig: WizardConfig;
  spaceWizard: SpaceWizardComponent;
  stepConfig: WizardStepConfig;

  // keep track of the number of instances
  static instanceCount: number = 1;

  @Input() title: string = 'Forge Wizard'; // default title
  @Input() forgeCommandName: string = 'none';
  @Output('onCancel') onCancel = new EventEmitter();

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
    // init Forge flow
    this.appGenerator.begin();
    ///// Wizard
    this.wizardConfig = {
      title: this.title,
      hidePreviousButton: true // TODO wait for merged and released https://github.com/patternfly/patternfly-ng/pull/112
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

  cancel() {
    console.log('cancel from ForgeAppGenerator');
    this.spaceWizard.finish();
    this.onCancel.emit({}); // TODO send forge wizard step
  }
  /** logger delegate delegates logging to a logger */
  private log: ILoggerDelegate = () => {};

}
