import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Settings } from '../../../../interfaces/Settings';
import { ElectronService } from '../../../core/services';
import { FileService } from '../../../core/services/file/file.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  profileFiles: { id: string, name: string }[] = [];
  savedSettings: Settings | null = null;
  settingsForm = this.fb.group({
    general: this.fb.group({
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      profiles: [[]] as string[][], // Initialize as a FormArray ,
      run_vision_mode_on_startup: [''],
      check_chest_tabs: [''],
      hidden_transparency: [''],
      local_prefs_path: ['']
    }),
    char: this.fb.group({
      inventory: [''],
      skill4: [''],
      skill3: [''],
      health_pot: ['']
    }),
    advanced_options: this.fb.group({
      run_scripts: [''],
      run_filter: [''],
      exit_key: [''],
      log_lvl: [''],
      scripts: ['']
    })
  });

  constructor(
    private router: Router,
    private electronService: ElectronService,
    private fb: FormBuilder,
    private file: FileService
  ) { }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.file.readProfiles();
    this.file.readConfigFile();
    this.file.settings$.pipe(takeUntil(this.destroy$)).subscribe(settings => {
      if (settings) {
        this.savedSettings = settings;
        this.settingsForm.reset(this.formSettings(settings));
      }
    });
    this.file.profileNames$.pipe(takeUntil(this.destroy$)).subscribe(files => {
      this.profileFiles = files.map(file => {
        const fileWithoutExt = file.replace(/\.y(a)?ml$/, '');
        return { id: fileWithoutExt, name: fileWithoutExt };
      });
    });
  }

  saveSettings() {
    const settings = this.fileSettings(this.settingsForm.value) as Settings;
    this.file.saveSettings(settings);
  }

  cancelChanges() {
    if (this.savedSettings) {
      this.settingsForm.reset(this.formSettings(this.savedSettings));
    }
  }

  resetSettings() {
    this.file.promptCreateConfigFile('Are you sure you want to load the default settings?');
  }

  fileSettings(settings: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
      ...settings,
      general: {
        ...settings.general,
        profiles: settings.general.profiles.length ? settings.general.profiles.join(',') : ''
      }
    }
  }

  formSettings(settings: Settings) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
      ...settings,
      general: {
        ...settings.general,
        profiles: settings.general.profiles ? settings.general.profiles.split(',') : []
      }
    }
  }
}