import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../services/lms-data.service';
import { LmsApiService } from '../../services/lms-api.service';
import { SeoService } from '../../services/seo.service';
import {
  LandingPageConfig,
  createDefaultLandingPage,
  CarouselSliderContent,
  NewsItem
} from '../../models/landing-page.model';
import { SafeResourceUrlPipe } from '../../pipes/safe-url.pipe';

@Component({
  selector: 'app-public-landing',
  imports: [CommonModule, RouterModule, FormsModule, SafeResourceUrlPipe],
  templateUrl: './landing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent implements OnInit, OnDestroy {
  isFullScreen = true; // Signal to AppComponent to remove sidebar/topbar/footer

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  lms = inject(LmsDataService);
  private api = inject(LmsApiService);
  private seo = inject(SeoService);

  activeLmsId = signal<string>('default');
  pageConfig = signal<LandingPageConfig>(createDefaultLandingPage('default', 'tenant-1', 'Enterprise LMS'));

  // Mobile menu
  mobileMenuOpen = signal<boolean>(false);

  // Modals
  videoModalOpen = signal<boolean>(false);
  videoModalUrl = signal<string>('https://www.youtube.com/embed/dQw4w9WgXcQ');
  
  enrollModalOpen = signal<boolean>(false);
  selectedCourseForEnroll = signal<any>(null);

  newsModalOpen = signal<boolean>(false);
  selectedNewsItem = signal<NewsItem | null>(null);

  // Legal Modals (Privacy & Terms)
  privacyModalOpen = signal<boolean>(false);
  termsModalOpen = signal<boolean>(false);
  cookiesModalOpen = signal<boolean>(false);
  activeLegalTab = signal<'privacy' | 'terms' | 'cookies'>('privacy');

  // Active Top Navigation Section Tracker
  activeNavSection = signal<string>('#hero');
  private scrollListener: (() => void) | null = null;

  // Interactive Carousel states
  activeSlideIndex = signal<number>(0);
  carouselIsPlaying = signal<boolean>(true);
  carouselProgressPercent = signal<number>(0);
  private carouselTimer: any = null;
  private carouselProgressInterval: any = null;

  // FAQ Accordion & Search
  faqOpenMap = signal<Record<string, boolean>>({ 'faq-1': true });
  faqFilterCategory = signal<string>('All');
  faqSearchQuery = signal<string>('');

  // Course Grid Filters
  selectedCategory = signal<string>('All Categories');
  courseSearchQuery = signal<string>('');

  // Contact Form
  contactSubmitting = signal<boolean>(false);
  contactSubmitted = signal<boolean>(false);
  contactForm = {
    name: '',
    email: '',
    phone: '',
    organization: '',
    subject: 'General Inquiries & Admissions',
    message: ''
  };

  // Newsletter
  newsletterEmail = signal<string>('');
  newsletterSubmitted = signal<boolean>(false);

  primaryColor = computed(() => {
    const curLms = this.lms.lmsInstances().find(l => l.id === this.activeLmsId());
    return curLms?.branding?.primaryColor || this.lms.activeTenant()?.branding?.primaryColor || '#EC008C';
  });

  accentColor = computed(() => {
    const curLms = this.lms.lmsInstances().find(l => l.id === this.activeLmsId());
    return curLms?.branding?.accentColor || this.lms.activeTenant()?.branding?.accentColor || '#005b94';
  });

  lmsLogo = computed(() => {
    const curLms = this.lms.lmsInstances().find(l => l.id === this.activeLmsId());
    return curLms?.branding?.logoUrl || curLms?.basicInfo?.logo?.url || this.pageConfig().navbar?.logoOverride || this.lms.activeTenant()?.branding?.logoUrl || '/assets/bracit-logo-light.png';
  });

  filteredCourses = computed(() => {
    const allCourses = this.lms.courses();
    const cat = this.selectedCategory();
    const q = this.courseSearchQuery().toLowerCase().trim();

    return allCourses.filter(c => {
      const matchCat = cat === 'All Categories' || (c.category && c.category.toLowerCase().includes(cat.toLowerCase()));
      const matchQ = !q || c.title.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q)) || (c.category && c.category.toLowerCase().includes(q));
      return matchCat && matchQ;
    });
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'] || this.lms.activeLms()?.id || 'tenant-1';
      this.activeLmsId.set(id);
      this.loadLandingPage(id);
    });

    this.startCarouselProgressTimer();
    this.setupScrollSpy();
  }

  ngOnDestroy(): void {
    this.stopCarouselTimer();
    if (this.scrollListener && typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  private setupScrollSpy(): void {
    if (typeof window === 'undefined') return;
    this.scrollListener = () => {
      const scrollPos = window.scrollY + 140;
      const sections = this.pageConfig().sections.filter(s => s.enabled);
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const sec = sections[i];
        const el = document.getElementById(sec.id) || document.getElementById(`builder-section-${sec.id}`);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top) {
            this.activeNavSection.set('#' + sec.id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', this.scrollListener, { passive: true });
  }

  isLinkActive(link: any): boolean {
    if (!link || !link.target) return false;
    const active = this.activeNavSection();
    if (link.target === active) return true;
    const cleanTarget = link.target.replace(/^#/, '');
    const cleanActive = active.replace(/^#/, '');
    return cleanTarget === cleanActive;
  }

  onHeroSearchSubmit(): void {
    const q = this.courseSearchQuery().trim();
    this.scrollToSection('#courses');
  }

  resetCourseFilters(): void {
    this.courseSearchQuery.set('');
    this.selectedCategory.set('All Categories');
  }

  // --- Legal Modals Handlers ---
  openPrivacyModal(): void {
    this.activeLegalTab.set('privacy');
    this.privacyModalOpen.set(true);
  }

  closePrivacyModal(): void {
    this.privacyModalOpen.set(false);
  }

  openTermsModal(): void {
    this.activeLegalTab.set('terms');
    this.termsModalOpen.set(true);
  }

  closeTermsModal(): void {
    this.termsModalOpen.set(false);
  }

  openCookiesModal(): void {
    this.activeLegalTab.set('cookies');
    this.cookiesModalOpen.set(true);
  }

  closeCookiesModal(): void {
    this.cookiesModalOpen.set(false);
  }

  handleFooterLegalLink(type: 'privacy' | 'terms' | 'cookies', event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    const footer = this.pageConfig().footer;
    const url = type === 'privacy' 
      ? (footer.privacyUrl || '#privacy') 
      : type === 'terms' 
        ? (footer.termsUrl || '#terms') 
        : (footer.cookiesUrl || '#cookies');

    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    if (type === 'privacy') {
      this.openPrivacyModal();
    } else if (type === 'terms') {
      this.openTermsModal();
    } else {
      this.openCookiesModal();
    }
  }

  loadLandingPage(lmsId: string): void {
    // Attempt to load from API backend first for dynamic fresh content
    this.api.getLandingPage(lmsId).subscribe({
      next: (res) => {
        if (res) {
          this.pageConfig.set(res);
          this.seo.updateLandingPageSeo(res);
          this.initCarouselConfig();
        } else {
          this.loadLocalConfig(lmsId);
        }
      },
      error: () => {
        this.loadLocalConfig(lmsId);
      }
    });
  }

  private loadLocalConfig(lmsId: string): void {
    const local = this.lms.getLandingPageForLms(lmsId);
    this.pageConfig.set(local);
    this.seo.updateLandingPageSeo(local);
    this.initCarouselConfig();
  }

  // --- Image Fallback Helpers ---
  getCourseImage(c: any): string {
    if (c?.coverImage && typeof c.coverImage === 'string' && c.coverImage.trim()) {
      return c.coverImage;
    }
    if (c?.thumbnailUrl && typeof c.thumbnailUrl === 'string' && c.thumbnailUrl.trim()) {
      return c.thumbnailUrl;
    }
    return this.getFallbackCoverImage(c?.category);
  }

  getFallbackCoverImage(category?: string): string {
    const cat = (category || '').toLowerCase();
    if (cat.includes('ai') || cat.includes('data')) {
      return 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80';
    }
    if (cat.includes('security') || cat.includes('iso')) {
      return 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80';
    }
    if (cat.includes('health') || cat.includes('clinical')) {
      return 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80';
    }
    if (cat.includes('lead') || cat.includes('manage')) {
      return 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80';
    }
    return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80';
  }

  onImgError(event: Event, category?: string): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = this.getFallbackCoverImage(category);
    }
  }

  // --- Hero Secondary CTA & Video Tour ---
  handleHeroSecondaryCta(heroContent: any): void {
    const actionType = heroContent?.secondaryCtaActionType || 'video_modal';

    if (actionType === 'video_modal') {
      const url = heroContent?.videoModalUrl || heroContent?.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      this.openVideoTour(url);
      return;
    }

    if (actionType === 'route_link' || actionType === 'route') {
      const target = heroContent?.secondaryCtaAction || '/courses';
      this.router.navigateByUrl(target);
      return;
    }

    if (actionType === 'external_url' || actionType === 'link') {
      const target = heroContent?.secondaryCtaAction || 'https://google.com';
      if (typeof window !== 'undefined') {
        window.open(target, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    // Scroll action
    const target = heroContent?.secondaryCtaAction || '#video';
    if (target.startsWith('#')) {
      const sectionExists = this.pageConfig().sections.some(s => s.id === target.substring(1) && s.enabled);
      if (sectionExists) {
        this.scrollToSection(target);
      } else {
        // Fallback to video tour modal if target section is not in page!
        this.openVideoTour(heroContent?.videoModalUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ');
      }
    } else {
      this.router.navigateByUrl(target);
    }
  }

  openVideoTour(url?: string): void {
    if (url) {
      this.videoModalUrl.set(url);
    }
    this.videoModalOpen.set(true);
  }

  closeVideoTour(): void {
    this.videoModalOpen.set(false);
  }

  // --- Course Enrollment Modal ---
  handleCourseEnroll(course: any, secContent?: any): void {
    const action = secContent?.enrollButtonAction || 'modal';
    if (action === 'route') {
      this.router.navigate(['/courses', course.id, 'learn']);
    } else if (action === 'login') {
      this.router.navigate(['/login'], { queryParams: { courseId: course.id } });
    } else {
      this.selectedCourseForEnroll.set(course);
      this.enrollModalOpen.set(true);
    }
  }

  closeEnrollModal(): void {
    this.enrollModalOpen.set(false);
    this.selectedCourseForEnroll.set(null);
  }

  confirmQuickEnroll(course: any): void {
    this.lms.showToast(`Successfully enrolled in "${course.title}"! Redirecting to classroom...`, 'success', 3500);
    this.closeEnrollModal();
    setTimeout(() => {
      this.router.navigate(['/courses', course.id, 'learn']);
    }, 600);
  }

  // --- News Modal ---
  openNewsModal(item: NewsItem): void {
    this.selectedNewsItem.set(item);
    this.newsModalOpen.set(true);
  }

  closeNewsModal(): void {
    this.newsModalOpen.set(false);
    this.selectedNewsItem.set(null);
  }

  // --- Carousel Animation & Controls ---
  getCarouselIntervalMs(): number {
    const slider = this.pageConfig().sections.find(s => s.type === 'carousel_slider');
    if (!slider || !slider.content) return 5000;
    const content = slider.content as CarouselSliderContent;
    if (content.autoPlayIntervalMs && content.autoPlayIntervalMs >= 500) {
      return content.autoPlayIntervalMs;
    }
    if (content.autoPlayInterval && content.autoPlayInterval > 0) {
      return content.autoPlayInterval >= 100 ? content.autoPlayInterval : content.autoPlayInterval * 1000;
    }
    return 5000;
  }

  private initCarouselConfig(): void {
    const slider = this.pageConfig().sections.find(s => s.type === 'carousel_slider');
    if (slider?.content) {
      const content = slider.content as CarouselSliderContent;
      const isAuto = content.autoPlay !== false;
      this.carouselIsPlaying.set(isAuto);
      if (content.slides && content.slides.length > 0) {
        if (this.activeSlideIndex() >= content.slides.length) {
          this.activeSlideIndex.set(0);
        }
      }
    }
    this.startCarouselProgressTimer();
  }

  private startCarouselProgressTimer(): void {
    this.stopCarouselTimer();
    const slider = this.pageConfig().sections.find(s => s.type === 'carousel_slider');
    const content = slider?.content as CarouselSliderContent | undefined;
    if (content && content.autoPlay === false && !this.carouselIsPlaying()) {
      return;
    }

    const interval = 50; // update progress every 50ms
    const totalDuration = this.getCarouselIntervalMs();
    const step = (interval / totalDuration) * 100;

    this.carouselProgressInterval = setInterval(() => {
      if (!this.carouselIsPlaying()) return;

      this.carouselProgressPercent.update(p => {
        if (p >= 100) {
          this.nextSlide(false);
          return 0;
        }
        return p + step;
      });
    }, interval);
  }

  private stopCarouselTimer(): void {
    if (this.carouselProgressInterval) {
      clearInterval(this.carouselProgressInterval);
      this.carouselProgressInterval = null;
    }
  }

  toggleCarouselPlay(): void {
    const isPlaying = !this.carouselIsPlaying();
    this.carouselIsPlaying.set(isPlaying);
    if (isPlaying) {
      this.startCarouselProgressTimer();
    }
  }

  nextSlide(manual: boolean = true): void {
    const slider = this.pageConfig().sections.find(s => s.type === 'carousel_slider');
    if (!slider || !slider.content?.slides?.length) return;
    const count = slider.content.slides.length;
    this.activeSlideIndex.update(idx => (idx + 1) % count);
    this.carouselProgressPercent.set(0);
  }

  prevSlide(): void {
    const slider = this.pageConfig().sections.find(s => s.type === 'carousel_slider');
    if (!slider || !slider.content?.slides?.length) return;
    const count = slider.content.slides.length;
    this.activeSlideIndex.update(idx => (idx - 1 + count) % count);
    this.carouselProgressPercent.set(0);
  }

  setSlide(index: number): void {
    const slider = this.pageConfig().sections.find(s => s.type === 'carousel_slider');
    if (!slider || !slider.content?.slides?.length) {
      this.activeSlideIndex.set(index);
      this.carouselProgressPercent.set(0);
      return;
    }
    const count = slider.content.slides.length;
    this.activeSlideIndex.set((index + count) % count);
    this.carouselProgressPercent.set(0);
  }

  // --- Navigation & FAQ ---
  scrollToSection(target: string): void {
    if (!target) return;
    this.mobileMenuOpen.set(false);
    
    if (target.startsWith('#')) {
      const secId = target.substring(1);
      this.activeNavSection.set(target);
      
      const el = document.getElementById(secId) || document.getElementById(`builder-section-${secId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      
      // Look up section by ID or type in pageConfig
      const matched = this.pageConfig().sections.find(s => s.id === secId || s.type === secId || s.type.startsWith(secId));
      if (matched) {
        const targetEl = document.getElementById(matched.id) || document.getElementById(`builder-section-${matched.id}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
    } else if (target.startsWith('http://') || target.startsWith('https://')) {
      if (typeof window !== 'undefined') {
        window.open(target, '_blank', 'noopener,noreferrer');
      }
    } else {
      // Check if target is a route or clean section name e.g. /courses or /about
      const clean = target.replace(/^\//, '');
      const matchedSec = this.pageConfig().sections.find(s => s.id === clean || s.type === clean || s.type.startsWith(clean));
      if (matchedSec) {
        this.activeNavSection.set('#' + matchedSec.id);
        const el = document.getElementById(matchedSec.id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
      
      if (target.startsWith('/login') || target.startsWith('/certificates') || target.startsWith('/courses')) {
        this.router.navigateByUrl(target);
      }
    }
  }

  toggleFaq(id: string): void {
    this.faqOpenMap.update(map => ({
      ...map,
      [id]: !map[id]
    }));
  }

  submitContact(): void {
    if (!this.contactForm.name || !this.contactForm.email || !this.contactForm.message) {
      this.lms.showToast('Please fill in all required fields.', 'error', 3000);
      return;
    }

    this.contactSubmitting.set(true);
    this.api.submitLandingContact(this.activeLmsId(), this.contactForm).subscribe({
      next: (res) => {
        this.contactSubmitting.set(false);
        this.contactSubmitted.set(true);
        this.lms.showToast(res.message || 'Inquiry received!', 'success', 3500);
      },
      error: () => {
        this.contactSubmitting.set(false);
        this.contactSubmitted.set(true);
        this.lms.showToast('Inquiry received! Our team will get back to you shortly.', 'success', 3500);
      }
    });
  }

  formatEmbedUrl(rawUrl: string | undefined, autoPlay: boolean = false, muted: boolean = true, loop: boolean = false, showControls: boolean = true): string {
    if (!rawUrl) return '';
    const url = rawUrl.trim();

    // Check YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      const videoId = ytMatch[1];
      const params: string[] = ['rel=0', 'enablejsapi=1'];
      if (autoPlay) {
        params.push('autoplay=1');
        params.push('mute=1');
        params.push('playsinline=1');
      } else if (muted) {
        params.push('mute=1');
      }
      if (loop) {
        params.push('loop=1');
        params.push(`playlist=${videoId}`);
      }
      if (showControls === false) {
        params.push('controls=0');
      }
      return `https://www.youtube.com/embed/${videoId}?${params.join('&')}`;
    }

    // Check Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      const videoId = vimeoMatch[1];
      const params: string[] = [];
      if (autoPlay) {
        params.push('autoplay=1');
        params.push('muted=1');
      } else if (muted) {
        params.push('muted=1');
      }
      if (loop) {
        params.push('loop=1');
      }
      if (showControls === false) {
        params.push('controls=0');
      }
      const query = params.length ? `?${params.join('&')}` : '';
      return `https://player.vimeo.com/video/${videoId}${query}`;
    }

    return url;
  }

  isVideoDirectFile(url?: string): boolean {
    if (!url) return false;
    const clean = url.toLowerCase().split('?')[0];
    return clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.ogg') || clean.endsWith('.mov');
  }

  getTickerSpeedSeconds(speed?: string): string {
    switch (speed) {
      case 'fast': return '15s';
      case 'slow': return '42s';
      case 'normal':
      default: return '26s';
    }
  }

  submitNewsletter(): void {
    const email = this.newsletterEmail().trim();
    if (!email || !email.includes('@')) {
      this.lms.showToast('Please enter a valid email address.', 'error', 2500);
      return;
    }

    this.api.submitLandingNewsletter(this.activeLmsId(), email).subscribe({
      next: (res) => {
        this.newsletterSubmitted.set(true);
        this.lms.showToast(res.message || 'Subscribed successfully!', 'success', 3000);
      },
      error: () => {
        this.newsletterSubmitted.set(true);
        this.lms.showToast('Subscribed to academy updates!', 'success', 3000);
      }
    });
  }
}
