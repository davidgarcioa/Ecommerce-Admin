import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  Output,
  PLATFORM_ID,
  Renderer2,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appAnimateOnView]',
})
export class AnimateOnViewDirective implements AfterViewInit, OnDestroy {
  @Input() appAnimateOnViewOnce = true;
  @Input() appAnimateOnViewMinVisibleRatio = 0.28;
  @Input() appAnimateOnViewRootMargin = '0px';
  @Output() readonly appAnimateOnViewVisible = new EventEmitter<void>();

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly ngZone = inject(NgZone);
  private readonly renderer = inject(Renderer2);
  private animationFrameId: number | null = null;
  private observer: IntersectionObserver | null = null;
  private visible = false;

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || !('IntersectionObserver' in window)) {
      this.markVisible();
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.animationFrameId = requestAnimationFrame(() => {
        if (this.isElementVisibleEnough()) {
          this.ngZone.run(() => this.markVisible());
        }
      });

      this.observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;

          if (entry !== undefined && entry.isIntersecting && this.isVisibleEnough(entry)) {
            this.ngZone.run(() => this.markVisible());

            if (this.appAnimateOnViewOnce) {
              this.observer?.disconnect();
            }
          } else if (!this.appAnimateOnViewOnce) {
            this.renderer.removeClass(this.elementRef.nativeElement, 'is-in-view');
          }
        },
        {
          root: null,
          rootMargin: this.appAnimateOnViewRootMargin,
          threshold: [0, 0.12, 0.24, 0.32, 0.48, 0.64, 0.8, 1],
        },
      );

      this.observer.observe(this.elementRef.nativeElement);
    });
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.observer?.disconnect();
  }

  private markVisible(): void {
    if (this.visible && this.appAnimateOnViewOnce) {
      return;
    }

    this.visible = true;
    this.renderer.addClass(this.elementRef.nativeElement, 'is-in-view');
    this.appAnimateOnViewVisible.emit();
  }

  private isElementVisibleEnough(): boolean {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const visibleX = Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0);
    const visibleY = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
    const visibleArea = Math.max(visibleX, 0) * Math.max(visibleY, 0);
    const totalArea = Math.max(rect.width * rect.height, 1);

    return visibleArea / totalArea >= this.appAnimateOnViewMinVisibleRatio;
  }

  private isVisibleEnough(entry: IntersectionObserverEntry): boolean {
    return entry.intersectionRatio >= this.appAnimateOnViewMinVisibleRatio;
  }
}
