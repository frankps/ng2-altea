import { Injectable, OnDestroy } from '@angular/core';
import { Idle, DEFAULT_INTERRUPTSOURCES } from '@ng-idle/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';

export interface IdleNotification {
  isIdle: boolean;
  /** starting from the moment system is gone idle (after IdleConfig.idleTimeSeconds) */
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
  enableHealthChecks?: boolean;     // Enable automatic health monitoring (default: true)
}

@Injectable({
  providedIn: 'root'
})
export class IdleNotificationService implements OnDestroy {
  private readonly defaultConfig: IdleConfig = {
    idleTimeSeconds: 900,              // 15 minutes
    timeoutWarningSeconds: 60,         // 1 minute warning
    notificationIntervalSeconds: 30,   // Notify every 30 seconds
    enableHealthChecks: true           // Enable health monitoring
  };

  private config: IdleConfig = { ...this.defaultConfig };
  
  // Current idle state
  private idleStartTime: Date | null = null;
  private isCurrentlyIdle = false;
  private isCurrentlyInWarning = false;
  private totalIdleTime = 0;
  private lastActivityDetected = new Date();
  private healthCheckFailures = 0;
  private readonly maxHealthCheckFailures = 3;
  private lastIdleStateChange = new Date();
  
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
      console.log('[IDLE-SERVICE] Manual idle reset at:', new Date().toISOString());
      this.lastActivityDetected = new Date();
      this.lastIdleStateChange = new Date(); // Update state change time
      this.healthCheckFailures = 0; // Reset health check failures
      
      // If currently idle, this will trigger onIdleEnd
      this.idle.interrupt();
    }
  }

  /**
   * Force restart the idle service (useful for debugging)
   */
  public forceRestart(): void {
    console.log('[IDLE-SERVICE] Force restarting idle service at:', new Date().toISOString());
    this.restartIdleService();
  }

  /**
   * Get debug information about the service state
   */
  public getDebugInfo(): any {
    return {
      isInitialized: this.isInitialized,
      isCurrentlyIdle: this.isCurrentlyIdle,
      isCurrentlyInWarning: this.isCurrentlyInWarning,
      idleStartTime: this.idleStartTime,
      lastActivityDetected: this.lastActivityDetected,
      lastIdleStateChange: this.lastIdleStateChange,
      healthCheckFailures: this.healthCheckFailures,
      config: this.config,
      idleServiceState: {
        isRunning: this.idle.isRunning()
        // Note: isIdleDetected method exists but isn't properly typed
      }
    };
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
      console.log('[IDLE-SERVICE] User went idle at:', new Date().toISOString());
      this.isCurrentlyIdle = true;
      this.idleStartTime = new Date();
      this.lastIdleStateChange = new Date();
      this.healthCheckFailures = 0; // Reset on state change
      this.emitCurrentState();
    });

    this.idle.onIdleEnd.subscribe(() => {
      console.log('[IDLE-SERVICE] User returned from idle at:', new Date().toISOString());
      this.updateTotalIdleTime();
      this.isCurrentlyIdle = false;
      this.isCurrentlyInWarning = false;
      this.idleStartTime = null;
      this.lastActivityDetected = new Date();
      this.lastIdleStateChange = new Date();
      this.healthCheckFailures = 0; // Reset on state change
      this.emitCurrentState();
    });

    this.idle.onTimeoutWarning.subscribe((countdown: number) => {
      console.log(`[IDLE-SERVICE] Timeout warning: ${countdown} seconds remaining at:`, new Date().toISOString());
      this.isCurrentlyInWarning = true;
      this.lastIdleStateChange = new Date(); // Update state change time
      this.emitCurrentState();
    });

    this.idle.onTimeout.subscribe(() => {
      console.log('[IDLE-SERVICE] User timed out at:', new Date().toISOString());
      this.updateTotalIdleTime();
      this.resetState();
      this.emitCurrentState();
      // Restart the idle service after timeout
      setTimeout(() => {
        this.restartIdleService();
      }, 1000); // Wait 1 second before restart
    });

    // Start watching for idle
    this.idle.watch();
    console.log('[IDLE-SERVICE] Started watching for idle activity at:', new Date().toISOString());
  }

  private startNotificationTimer(): void {
    // Emit current state every N seconds and perform health checks
    this.notificationTimerSubscription = interval(this.config.notificationIntervalSeconds * 1000)
      .subscribe(() => {
        if (this.config.enableHealthChecks) {
          this.performHealthCheck();
        }
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

  private performHealthCheck(): void {
    const now = new Date();
    const timeSinceLastStateChange = now.getTime() - this.lastIdleStateChange.getTime();
    const timeSinceLastActivity = now.getTime() - this.lastActivityDetected.getTime();
    
    // Only perform health checks if we've been running for a reasonable amount of time
    const serviceRunningTime = now.getTime() - this.lastIdleStateChange.getTime();
    if (serviceRunningTime < 60000) { // Don't check for first minute
      return;
    }
    
    // If we haven't detected any state changes for a very long time, something might be wrong
    const maxTimeWithoutStateChange = (this.config.idleTimeSeconds + 600) * 1000; // idle time + 10 minutes buffer
    
    console.log(`[IDLE-SERVICE] Health check - Time since last state change: ${timeSinceLastStateChange/1000}s, Time since last activity: ${timeSinceLastActivity/1000}s, Currently idle: ${this.isCurrentlyIdle}`);
    
    // Only consider it a problem if:
    // 1. We haven't had state changes for a very long time AND
    // 2. We're not currently idle AND 
    // 3. User should definitely be idle by now
    const shouldBeIdle = timeSinceLastActivity > (this.config.idleTimeSeconds + 60) * 1000; // Add 1 minute buffer
    
    if (timeSinceLastStateChange > maxTimeWithoutStateChange && 
        !this.isCurrentlyIdle && 
        shouldBeIdle) {
      
      this.healthCheckFailures++;
      console.warn(`[IDLE-SERVICE] Health check failure ${this.healthCheckFailures}/${this.maxHealthCheckFailures} - Service may be stuck (should be idle but isn't)`);
      
      if (this.healthCheckFailures >= this.maxHealthCheckFailures) {
        console.error('[IDLE-SERVICE] Multiple health check failures - restarting idle service');
        this.restartIdleService();
      }
    } else {
      // Reset health check failures if everything looks good
      if (this.healthCheckFailures > 0) {
        console.log('[IDLE-SERVICE] Health check passed - resetting failure count');
        this.healthCheckFailures = 0;
      }
    }
  }

  private restartIdleService(): void {
    console.log('[IDLE-SERVICE] Restarting idle service...');
    
    // Stop current instance
    this.idle.stop();
    
    // Reset state
    this.healthCheckFailures = 0;
    this.lastActivityDetected = new Date();
    this.lastIdleStateChange = new Date();
    
    // Small delay before restart to ensure cleanup
    setTimeout(() => {
      console.log('[IDLE-SERVICE] Re-initializing idle service...');
      this.setupIdleService();
    }, 100);
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
    this.lastActivityDetected = new Date();
    this.lastIdleStateChange = new Date();
    this.healthCheckFailures = 0;
  }

  ngOnDestroy(): void {
    this.stop();
  }
}