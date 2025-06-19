import { Injectable, OnDestroy } from '@angular/core';
import { Idle, DEFAULT_INTERRUPTSOURCES } from '@ng-idle/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';

export interface IdleNotification {
  isIdle: boolean;
  idleTimeSeconds: number;
  totalIdleTimeSeconds: number;
  timeUntilTimeoutSeconds?: number;
  isWarning: boolean;
  timestamp: Date;
}

export interface IdleConfig {
  idleTimeSeconds: number;          // Time before considered idle (default: 900 = 15 minutes)
  timeoutWarningSeconds: number;    // Warning time before timeout (default: 60 = 1 minute)
  notificationIntervalSeconds: number; // How often to notify subscribers (default: 30 seconds)
}

@Injectable({
  providedIn: 'root'
})
export class IdleNotificationService implements OnDestroy {
  private readonly defaultConfig: IdleConfig = {
    idleTimeSeconds: 900,              // 15 minutes
    timeoutWarningSeconds: 60,         // 1 minute warning
    notificationIntervalSeconds: 5    // Notify every 30 seconds
  };

  private config: IdleConfig = { ...this.defaultConfig };
  
  // Current idle state
  private idleStartTime: Date | null = null;
  private isCurrentlyIdle = false;
  private isCurrentlyInWarning = false;
  private totalIdleTime = 0;
  
  // Observables for subscribers
  private idleNotificationSubject = new BehaviorSubject<IdleNotification>(this.createInitialNotification());
  public idleNotification$: Observable<IdleNotification> = this.idleNotificationSubject.asObservable();
  
  // Internal subscriptions
  private notificationTimerSubscription?: Subscription;
  private isInitialized = false;

  constructor(private idle: Idle) {}

  /**
   * Initialize the idle service with custom configuration
   */
  public initialize(config?: Partial<IdleConfig>): void {
    if (this.isInitialized) {
      console.warn('IdleNotificationService is already initialized');
      return;
    }

    // Merge with default config
    this.config = { ...this.defaultConfig, ...config };
    
    this.setupIdleService();
    this.startNotificationTimer();
    this.isInitialized = true;
    
    console.log('IdleNotificationService initialized with config:', this.config);
  }

  /**
   * Get current idle notification state
   */
  public getCurrentState(): IdleNotification {
    return this.idleNotificationSubject.value;
  }

  /**
   * Manually reset idle timer (useful for programmatic activity)
   */
  public resetIdle(): void {
    if (this.isInitialized) {
      this.idle.interrupt();
    }
  }

  /**
   * Stop the idle service
   */
  public stop(): void {
    this.idle.stop();
    this.stopNotificationTimer();
    this.resetState();
    this.isInitialized = false;
  }

  /**
   * Update configuration (requires restart)
   */
  public updateConfig(newConfig: Partial<IdleConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (this.isInitialized) {
      this.stop();
      this.initialize(this.config);
    }
  }

  private setupIdleService(): void {
    // Configure ng-idle
    this.idle.setIdle(this.config.idleTimeSeconds);
    this.idle.setTimeout(this.config.timeoutWarningSeconds);
    this.idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);

    // Subscribe to idle events
    this.idle.onIdleStart.subscribe(() => {
      console.log('User went idle');
      this.isCurrentlyIdle = true;
      this.idleStartTime = new Date();
      this.emitCurrentState();
    });

    this.idle.onIdleEnd.subscribe(() => {
      console.log('User returned from idle');
      this.updateTotalIdleTime();
      this.isCurrentlyIdle = false;
      this.isCurrentlyInWarning = false;
      this.idleStartTime = null;
      this.emitCurrentState();
    });

    this.idle.onTimeoutWarning.subscribe((countdown: number) => {
      console.log(`Timeout warning: ${countdown} seconds remaining`);
      this.isCurrentlyInWarning = true;
      this.emitCurrentState();
    });

    this.idle.onTimeout.subscribe(() => {
      console.log('User timed out');
      this.updateTotalIdleTime();
      this.resetState();
      this.emitCurrentState();
    });

    // Start watching for idle
    this.idle.watch();
  }

  private startNotificationTimer(): void {
    // Emit current state every N seconds
    this.notificationTimerSubscription = interval(this.config.notificationIntervalSeconds * 1000)
      .subscribe(() => {
        this.emitCurrentState();
      });
  }

  private stopNotificationTimer(): void {
    if (this.notificationTimerSubscription) {
      this.notificationTimerSubscription.unsubscribe();
      this.notificationTimerSubscription = undefined;
    }
  }

  private emitCurrentState(): void {
    const notification = this.createCurrentNotification();
    this.idleNotificationSubject.next(notification);
  }

  private createCurrentNotification(): IdleNotification {
    const now = new Date();
    let currentIdleTime = 0;
    let timeUntilTimeout: number | undefined;

    if (this.isCurrentlyIdle && this.idleStartTime) {
      currentIdleTime = Math.floor((now.getTime() - this.idleStartTime.getTime()) / 1000);
      
      if (this.isCurrentlyInWarning) {
        const totalAllowedTime = this.config.idleTimeSeconds + this.config.timeoutWarningSeconds;
        const totalElapsed = currentIdleTime;
        timeUntilTimeout = Math.max(0, totalAllowedTime - totalElapsed);
      }
    }

    return {
      isIdle: this.isCurrentlyIdle,
      idleTimeSeconds: currentIdleTime,
      totalIdleTimeSeconds: this.totalIdleTime + currentIdleTime,
      timeUntilTimeoutSeconds: timeUntilTimeout,
      isWarning: this.isCurrentlyInWarning,
      timestamp: now
    };
  }

  private createInitialNotification(): IdleNotification {
    return {
      isIdle: false,
      idleTimeSeconds: 0,
      totalIdleTimeSeconds: 0,
      isWarning: false,
      timestamp: new Date()
    };
  }

  private updateTotalIdleTime(): void {
    if (this.idleStartTime) {
      const idleTime = Math.floor((new Date().getTime() - this.idleStartTime.getTime()) / 1000);
      this.totalIdleTime += idleTime;
    }
  }

  private resetState(): void {
    this.isCurrentlyIdle = false;
    this.isCurrentlyInWarning = false;
    this.idleStartTime = null;
    this.totalIdleTime = 0;
  }

  ngOnDestroy(): void {
    this.stop();
  }
}