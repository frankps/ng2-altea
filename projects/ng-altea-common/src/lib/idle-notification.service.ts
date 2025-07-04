import { Injectable, OnDestroy, NgZone } from '@angular/core';
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
  private lastActivityTime = new Date();
  
  // Custom idle detection
  private idleCheckInterval?: number;
  private eventListeners: Array<{ element: any, event: string, handler: EventListener }> = [];
  
  // Observables for subscribers
  private idleNotificationSubject = new BehaviorSubject<IdleNotification>(this.createInitialNotification());
  public idleNotification$: Observable<IdleNotification> = this.idleNotificationSubject.asObservable();
  
  private isInitialized = false;

  // Events that indicate user activity
  private readonly activityEvents = [
    'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'touchmove', 'click', 'keydown'
  ];

  constructor(private ngZone: NgZone) {}

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
    
    this.setupCustomIdleDetection();
    this.isInitialized = true;
    
    console.log('[IDLE-SERVICE] Custom idle service initialized with config:', this.config);
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
      this.recordActivity();
    }
  }

  /**
   * Stop the idle service
   */
  public stop(): void {
    this.cleanup();
    this.resetState();
    this.isInitialized = false;
    console.log('[IDLE-SERVICE] Service stopped');
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

  private setupCustomIdleDetection(): void {
    // Record initial activity
    this.lastActivityTime = new Date();
    
    // Set up event listeners for user activity
    this.setupActivityListeners();
    
    // Start checking for idle state every 5 seconds
    this.ngZone.runOutsideAngular(() => {
      this.idleCheckInterval = window.setInterval(() => {
        this.checkIdleState();
      }, 5000); // Check every 5 seconds
    });

    console.log('[IDLE-SERVICE] Custom idle detection started');
  }

  private setupActivityListeners(): void {
    this.activityEvents.forEach(eventName => {
      const handler = () => this.recordActivity();
      
      // Add listener to document
      document.addEventListener(eventName, handler, { passive: true });
      
      // Keep track for cleanup
      this.eventListeners.push({
        element: document,
        event: eventName,
        handler: handler
      });
    });

    console.log('[IDLE-SERVICE] Activity listeners attached for events:', this.activityEvents);
  }

  private recordActivity(): void {
    const now = new Date();
    const wasIdle = this.isCurrentlyIdle;
    
    this.lastActivityTime = now;
    
    // If user was idle and now active, emit idle end event
    if (wasIdle) {
      console.log('[IDLE-SERVICE] User returned from idle at:', now.toISOString());
      this.isCurrentlyIdle = false;
      
      const idleDuration = this.idleStartTime ? 
        Math.floor((now.getTime() - this.idleStartTime.getTime()) / 1000) : 0;
      
      this.idleStartTime = null;
      this.emitIdleEndEvent(idleDuration);
    }
  }

  private checkIdleState(): void {
    if (!this.isInitialized) return;

    const now = new Date();
    const timeSinceLastActivity = now.getTime() - this.lastActivityTime.getTime();
    const idleThresholdMs = this.config.idleTimeSeconds * 1000;

    // Check if user should be considered idle
    if (!this.isCurrentlyIdle && timeSinceLastActivity >= idleThresholdMs) {
      console.log('[IDLE-SERVICE] User went idle at:', now.toISOString());
      this.isCurrentlyIdle = true;
      this.idleStartTime = now;
      
      // Run in Angular zone to trigger change detection
      this.ngZone.run(() => {
        this.emitIdleStartEvent();
      });
    }
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

  private emitIdleEndEvent(idleDuration: number): void {
    const notification: IdleNotification = {
      isIdle: false,
      idleTimeSeconds: idleDuration, // How long they were idle
      timestamp: new Date()
    };
    
    // Run in Angular zone to trigger change detection
    this.ngZone.run(() => {
      console.log('[IDLE-SERVICE] Emitting IDLE END event:', notification);
      this.idleNotificationSubject.next(notification);
    });
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
    this.lastActivityTime = new Date();
  }

  private cleanup(): void {
    // Clear interval
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = undefined;
    }

    // Remove all event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];

    console.log('[IDLE-SERVICE] Cleanup completed');
  }

  ngOnDestroy(): void {
    this.stop();
  }
}