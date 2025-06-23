import { Injectable, OnDestroy } from '@angular/core';
import { Idle, DEFAULT_INTERRUPTSOURCES } from '@ng-idle/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface IdleNotification {
  isIdle: boolean;
  idleTimeSeconds: number;
  timestamp: Date;
}

export interface IdleConfig {
  idleTimeSeconds: number;          // Time before considered idle (default: 300 = 5 minutes)
}

@Injectable({
  providedIn: 'root'
})
export class IdleNotificationService implements OnDestroy {
  private readonly defaultConfig: IdleConfig = {
    idleTimeSeconds: 300              // 5 minutes
  };

  private config: IdleConfig = { ...this.defaultConfig };
  
  // Current idle state
  private isCurrentlyIdle = false;
  private idleStartTime: Date | null = null;
  
  // Observables for subscribers
  private idleNotificationSubject = new BehaviorSubject<IdleNotification>(this.createInitialNotification());
  public idleNotification$: Observable<IdleNotification> = this.idleNotificationSubject.asObservable();
  
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
      console.log('[IDLE-SERVICE] Manual idle reset at:', new Date().toISOString());
      this.idle.interrupt();
    }
  }

  /**
   * Stop the idle service
   */
  public stop(): void {
    this.idle.stop();
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
    // Configure ng-idle - no timeout since we don't need warnings
    this.idle.setIdle(this.config.idleTimeSeconds);
    this.idle.setTimeout(0); // No timeout warnings
    this.idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);

    // Subscribe to idle events
    this.idle.onIdleStart.subscribe(() => {
      console.log('[IDLE-SERVICE] User went idle at:', new Date().toISOString());
      this.isCurrentlyIdle = true;
      this.idleStartTime = new Date();
      this.emitIdleStartEvent();
    });

    this.idle.onIdleEnd.subscribe(() => {
      console.log('[IDLE-SERVICE] User returned from idle at:', new Date().toISOString());
      this.isCurrentlyIdle = false;
      this.idleStartTime = null;
      this.emitIdleEndEvent();
    });

    // Start watching for idle
    this.idle.watch();
    console.log('[IDLE-SERVICE] Started watching for idle activity');
  }

  private emitIdleStartEvent(): void {
    const notification: IdleNotification = {
      isIdle: true,
      idleTimeSeconds: 0, // Just became idle
      timestamp: new Date()
    };
    
    console.log('[IDLE-SERVICE] Emitting IDLE START event:', notification);
    this.idleNotificationSubject.next(notification);
  }

  private emitIdleEndEvent(): void {
    const currentIdleTime = this.calculateCurrentIdleTime();
    
    const notification: IdleNotification = {
      isIdle: false,
      idleTimeSeconds: currentIdleTime, // How long they were idle
      timestamp: new Date()
    };
    
    console.log('[IDLE-SERVICE] Emitting IDLE END event:', notification);
    this.idleNotificationSubject.next(notification);
  }

  private calculateCurrentIdleTime(): number {
    if (this.idleStartTime) {
      return Math.floor((new Date().getTime() - this.idleStartTime.getTime()) / 1000);
    }
    return 0;
  }

  private createInitialNotification(): IdleNotification {
    return {
      isIdle: false,
      idleTimeSeconds: 0,
      timestamp: new Date()
    };
  }

  private resetState(): void {
    this.isCurrentlyIdle = false;
    this.idleStartTime = null;
  }

  ngOnDestroy(): void {
    this.stop();
  }
}