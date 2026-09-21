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
  LandingSection,
  LandingSectionType,
  BackgroundStyleType,
  HeroBannerContent,
  VideoShowcaseContent,
  CarouselSliderContent,
  CarouselSlide,
  CoursesGridContent,
  LatestNewsContent,
  InstructorsDirectoryContent,
  TestimonialsContent,
  PartnersTickerContent,
  AboutUsContent,
  ContactFormContent,
  FaqAccordionContent,
  CtaBannerContent,
  HeroStatChip,
  createDefaultLandingPage
} from '../../models/landing-page.model';
import { SafeResourceUrlPipe } from '../../pipes/safe-url.pipe';

@Component({
  selector: 'app-landing-builder',
  imports: [CommonModule, RouterModule, FormsModule, SafeResourceUrlPipe],
  templateUrl: './landing-builder.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:keydown)': 'handleKeyboardShortcuts($event)'
  }
})
export class LandingBuilderComponent implements OnInit, OnDestroy {
  isFullScreen = true; // Signal to AppComponent to remove sidebar/topbar/footer

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  lms = inject(LmsDataService);
  private api = inject(LmsApiService);
  private seo = inject(SeoService);

  // Active LMS Identifier
  activeLmsId = signal<string>('default');

  // Working Landing Page Configuration State
  pageConfig = signal<LandingPageConfig>(createDefaultLandingPage('default', 'tenant-1', 'Enterprise LMS'));

  // Builder Viewport & Tooling Mode
  viewportMode = signal<'desktop' | 'tablet' | 'mobile'>('desktop');
  builderTab = signal<'sections' | 'inspector' | 'navbar' | 'footer' | 'seo' | 'templates'>('sections');
  isLivePreview = signal<boolean>(false);
  selectedSectionId = signal<string>('hero');

  // Modals & Drawers
  showAddSectionModal = signal<boolean>(false);
  showSeoModal = signal<boolean>(false);
  showTemplatesModal = signal<boolean>(false);
  showResetConfirmModal = signal<boolean>(false);
  showCodeExportModal = signal<boolean>(false);
  insertSectionAtIndex = signal<number>(-1);

  // Legal Modals in Preview
  privacyModalOpen = signal<boolean>(false);
  termsModalOpen = signal<boolean>(false);
  cookiesModalOpen = signal<boolean>(false);
  activeLegalTab = signal<'privacy' | 'terms' | 'cookies'>('privacy');

  // Active Nav Tracker in Canvas
  activeNavSection = signal<string>('#hero');

  // Undo/Redo History Stack
  historyStack = signal<LandingPageConfig[]>([]);
  historyIndex = signal<number>(-1);

  // Active carousel slide index in preview
  activeSlideIndex = signal<number>(0);
  carouselIsPlaying = signal<boolean>(true);
  carouselProgressPercent = signal<number>(0);
  private carouselProgressInterval: any = null;

  // FAQ Accordion Open Map
  faqOpenMap = signal<Record<string, boolean>>({ 'faq-1': true });

  // Selected Category filter for preview
  selectedCategory = signal<string>('All Categories');
  courseSearchQuery = signal<string>('');

  // Contact Form preview state
  contactSubmitting = signal<boolean>(false);
  contactSubmitted = signal<boolean>(false);
  contactForm = {
    name: 'Jane Doe',
    email: 'jane.doe@enterprise.com',
    subject: 'Enterprise Team License & Multi-Tenant Setup',
    message: 'We are evaluating your enterprise academy for 500 team members across our security and cloud divisions.'
  };

  // Newsletter preview state
  newsletterEmail = signal<string>('');
  newsletterSubmitted = signal<boolean>(false);

  // Computed Properties
  selectedSection = computed<LandingSection | null>(() => {
    const id = this.selectedSectionId();
    const sec = this.pageConfig().sections.find(s => s.id === id);
    return sec || (this.pageConfig().sections[0] || null);
  });

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
      const matchCat = cat === 'All Categories' || c.category.toLowerCase().includes(cat.toLowerCase());
      const matchQ = !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'] || this.lms.activeLms()?.id || 'tenant-1';
      this.activeLmsId.set(id);
      this.loadLandingPage(id);
    });
  }

  ngOnDestroy(): void {
    this.stopCarouselTimer();
  }

  loadLandingPage(lmsId: string): void {
    const local = this.lms.getLandingPageForLms(lmsId);
    this.pageConfig.set(JSON.parse(JSON.stringify(local)));
    this.pushHistoryState(this.pageConfig());
    this.seo.updateLandingPageSeo(this.pageConfig());
    this.initCarouselConfig();
  }

  // Carousel Autoplay Engine for Builder Preview
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

  initCarouselConfig(): void {
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

  onLmsChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target && target.value) {
      this.activeLmsId.set(target.value);
      this.loadLandingPage(target.value);
      this.router.navigate(['/landing-builder', target.value]);
    }
  }

  // Viewport Switcher
  setViewport(mode: 'desktop' | 'tablet' | 'mobile'): void {
    this.viewportMode.set(mode);
  }

  setTab(tab: 'sections' | 'inspector' | 'navbar' | 'footer' | 'seo' | 'templates'): void {
    this.builderTab.set(tab);
  }

  toggleLivePreview(): void {
    this.isLivePreview.update(v => !v);
  }

  selectSection(id: string): void {
    this.selectedSectionId.set(id);
    this.builderTab.set('inspector');
    // Scroll element into view smoothly inside iframe/canvas
    setTimeout(() => {
      const el = document.getElementById(`builder-section-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  // History / Undo / Redo
  pushHistoryState(config: LandingPageConfig): void {
    const currentStack = this.historyStack().slice(0, this.historyIndex() + 1);
    currentStack.push(JSON.parse(JSON.stringify(config)));
    if (currentStack.length > 25) currentStack.shift();
    this.historyStack.set(currentStack);
    this.historyIndex.set(currentStack.length - 1);
  }

  undo(): void {
    if (this.historyIndex() > 0) {
      const newIdx = this.historyIndex() - 1;
      this.historyIndex.set(newIdx);
      const state = JSON.parse(JSON.stringify(this.historyStack()[newIdx]));
      this.pageConfig.set(state);
      this.lms.showToast('Reverted to previous change', 'info', 1500, 'Undo');
    }
  }

  redo(): void {
    if (this.historyIndex() < this.historyStack().length - 1) {
      const newIdx = this.historyIndex() + 1;
      this.historyIndex.set(newIdx);
      const state = JSON.parse(JSON.stringify(this.historyStack()[newIdx]));
      this.pageConfig.set(state);
      this.lms.showToast('Redid change', 'info', 1500, 'Redo');
    }
  }

  // Section Reordering & CRUD
  moveSection(index: number, direction: 'up' | 'down'): void {
    const sections = [...this.pageConfig().sections];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const temp = sections[index];
    sections[index] = sections[targetIdx];
    sections[targetIdx] = temp;

    sections.forEach((s, idx) => s.order = idx);

    this.updatePageConfig({ sections });
    this.lms.showToast(`Section "${temp.title}" moved ${direction}`, 'info', 1500, 'Section Reordered');
  }

  toggleSectionVisibility(section: LandingSection, event?: Event): void {
    if (event) event.stopPropagation();
    const sections = this.pageConfig().sections.map(s => {
      if (s.id === section.id) {
        return { ...s, enabled: !s.enabled };
      }
      return s;
    });
    this.updatePageConfig({ sections });
    this.lms.showToast(`Section "${section.title}" ${!section.enabled ? 'enabled' : 'hidden'}`, 'info', 1500);
  }

  duplicateSection(section: LandingSection, event?: Event): void {
    if (event) event.stopPropagation();
    const sections = [...this.pageConfig().sections];
    const sourceIdx = sections.findIndex(s => s.id === section.id);
    if (sourceIdx === -1) return;

    const newId = `${section.type}-${Date.now().toString().slice(-4)}`;
    const cloned: LandingSection = JSON.parse(JSON.stringify(section));
    cloned.id = newId;
    cloned.title = `${section.title} (Copy)`;
    
    sections.splice(sourceIdx + 1, 0, cloned);
    sections.forEach((s, idx) => s.order = idx);

    this.updatePageConfig({ sections });
    this.selectSection(newId);
    this.lms.showToast(`Duplicated section "${section.title}"`, 'success', 2000, 'Section Duplicated');
  }

  deleteSection(sectionId: string, event?: Event): void {
    if (event) event.stopPropagation();
    const sections = this.pageConfig().sections.filter(s => s.id !== sectionId);
    sections.forEach((s, idx) => s.order = idx);

    this.updatePageConfig({ sections });
    if (this.selectedSectionId() === sectionId && sections.length > 0) {
      this.selectedSectionId.set(sections[0].id);
    }
    this.lms.showToast('Section removed from landing page', 'info', 2000, 'Section Deleted');
  }

  openAddSectionModal(index: number = -1): void {
    this.insertSectionAtIndex.set(index);
    this.showAddSectionModal.set(true);
  }

  addSectionFromLibrary(type: LandingSectionType): void {
    const lmsName = this.pageConfig().lmsName;
    const newId = `${type}-${Date.now().toString().slice(-4)}`;
    let newSection: LandingSection;

    switch (type) {
      case 'hero_banner':
        newSection = {
          id: newId,
          type: 'hero_banner',
          title: 'Hero Welcome Banner',
          subtitle: 'Main introductory banner',
          badge: 'Premier Academy',
          enabled: true,
          order: 0,
          layout: 'split',
          background: { type: 'theme_gradient', overlayOpacity: 10 },
          padding: 'spacious',
          content: {
            headline: `Accelerate Your Career with ${lmsName}`,
            subheadline: 'Accredited enterprise certifications, practical skill roadmaps, and verified micro-credentials.',
            badgeText: '🌟 2026 Accredited Enterprise Learning',
            badgeIcon: 'verified',
            primaryCtaText: 'Browse Courses',
            primaryCtaAction: '#courses',
            secondaryCtaText: 'Watch Tour',
            secondaryCtaAction: '#video',
            heroMedia: 'interactive_card',
            heroImageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200',
            showSearchBox: true,
            searchPlaceholder: 'Search 250+ courses and skills...',
            statChips: [
              { id: 's1', value: '45,000+', label: 'Active Learners', icon: 'groups' },
              { id: 's2', value: '98.6%', label: 'Completion Rate', icon: 'trending_up' },
              { id: 's3', value: '180+', label: 'Accredited Programs', icon: 'workspace_premium' }
            ]
          } as HeroBannerContent
        };
        break;

      case 'video_showcase':
        newSection = {
          id: newId,
          type: 'video_showcase',
          title: 'Platform Video Tour',
          subtitle: 'Watch our interactive classroom player and digital credential ecosystem in action',
          badge: 'Interactive Tour',
          enabled: true,
          order: 0,
          layout: 'centered',
          background: { type: 'theme_light' },
          padding: 'spacious',
          content: {
            videoTitle: 'Inside the Learner Portal & Classroom Player',
            badgeText: 'HD Video Walkthrough (3:45)',
            description: 'A 360-degree tour of our modular curriculum architecture, live virtual classrooms, real-time quizzes, and verifiable certificates.',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            posterUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200',
            durationText: '3 Min Video',
            bulletPoints: [
              'Interactive microlearning lessons on desktop, tablet, and mobile',
              'Live instructor office hours and collaborative discussion boards',
              'Automated gradebook sync, transcripts, and verifiable badge credentials'
            ],
            statsList: [
              { label: 'Video Lessons', value: '1,200+' },
              { label: 'Avg Rating', value: '4.9 / 5.0' },
              { label: 'Mobile Ready', value: '100%' }
            ],
            autoPlay: false
          } as VideoShowcaseContent
        };
        break;

      case 'carousel_slider':
        newSection = {
          id: newId,
          type: 'carousel_slider',
          title: 'Featured Initiatives',
          subtitle: 'Interactive highlight carousel showcasing core program pillars',
          badge: 'Highlights',
          enabled: true,
          order: 0,
          layout: 'fullwidth',
          background: { type: 'neutral' },
          padding: 'standard',
          content: {
            autoPlayIntervalMs: 6000,
            showDots: true,
            showArrows: true,
            slides: [
              {
                id: 'slide-1',
                title: 'Enterprise AI & Cloud Specialization',
                subtitle: 'Deep dive into LLM fine-tuning, multi-agent pipelines, and zero-trust cloud security.',
                imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1600',
                badge: 'Specialization',
                ctaText: 'View Curriculum',
                ctaAction: '#courses',
                overlayStyle: 'dark'
              },
              {
                id: 'slide-2',
                title: 'ISO 27001 & SOC-2 Cybersecurity Master Series',
                subtitle: 'Mandatory and elective compliance paths designed by top industry practitioners with automated certificates.',
                imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1600',
                badge: 'Certification',
                ctaText: 'Explore Compliance',
                ctaAction: '#courses',
                overlayStyle: 'gradient'
              }
            ]
          } as CarouselSliderContent
        };
        break;

      case 'courses_grid':
        newSection = {
          id: newId,
          type: 'courses_grid',
          title: 'Featured Curriculum & Programs',
          subtitle: 'Explore our highest rated programs taught by leading industry practitioners with verifiable digital certificates.',
          badge: 'Top Programs',
          enabled: true,
          order: 0,
          layout: 'standard',
          background: { type: 'neutral' },
          padding: 'spacious',
          content: {
            sectionTagline: 'Curated by master instructional designers to guarantee job-ready competency.',
            filterCategories: ['All Categories', 'Compliance & Security', 'AI & Data', 'Healthcare', 'Engineering', 'Leadership'],
            displayCount: 6,
            columns: 3,
            showPrice: true,
            showRating: true,
            showEnrollButton: true,
            viewAllLink: '/courses'
          } as CoursesGridContent
        };
        break;

      case 'instructors_directory':
        newSection = {
          id: newId,
          type: 'instructors_directory',
          title: 'Learn from Recognized Global Experts',
          subtitle: 'Our instructors combine world-class research with decades of active executive and technical leadership.',
          badge: 'Distinguished Faculty',
          enabled: true,
          order: 0,
          layout: 'standard',
          background: { type: 'theme_light' },
          padding: 'spacious',
          content: {
            displayCount: 4,
            layout: 'cards',
            instructors: [
              {
                id: 'inst-1',
                name: 'Dr. Sarah Sterling',
                title: 'Chief Information Security Officer & Fellow',
                department: 'Cybersecurity & Governance',
                bio: 'Former Fortune 500 security director with 18+ years leading SOC-2, ISO 27001, and Zero-Trust architecture.',
                avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300',
                rating: 4.96,
                coursesCount: 8,
                studentsCount: '14,200',
                specialties: ['ISO 27001', 'Cloud Security', 'Threat Modeling']
              },
              {
                id: 'inst-2',
                name: 'Marcus Thorne',
                title: 'VP of AI Research & Lead Architect',
                department: 'Artificial Intelligence & Systems',
                bio: 'Author of enterprise LLM playbooks and pioneer in multi-agent orchestration and production RAG pipelines.',
                avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
                rating: 4.98,
                coursesCount: 12,
                studentsCount: '19,800',
                specialties: ['Generative AI', 'Agentic Workflows', 'Python']
              }
            ]
          } as InstructorsDirectoryContent
        };
        break;

      case 'testimonials':
        newSection = {
          id: newId,
          type: 'testimonials',
          title: 'Trusted by Thousands of Professionals',
          subtitle: 'Read real reviews and success stories from learners and enterprise teams who transformed their careers.',
          badge: 'Social Proof',
          enabled: true,
          order: 0,
          layout: 'standard',
          background: { type: 'neutral' },
          padding: 'spacious',
          content: {
            layout: 'grid',
            testimonials: [
              {
                id: 't-1',
                name: 'Alexandra Wright',
                role: 'Lead Cloud Architect',
                organization: 'Apex Global Enterprises',
                avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
                rating: 5,
                comment: 'The structured learning phases and instant certificate verification helped our entire engineering department attain SOC-2 compliance in half the standard timeframe.',
                verified: true,
                courseTaken: 'ISO 27001 & SOC-2 Cybersecurity Governance'
              }
            ]
          } as TestimonialsContent
        };
        break;

      case 'partners_ticker':
        newSection = {
          id: newId,
          type: 'partners_ticker',
          title: 'Accredited by Global Authorities & Industry Leaders',
          subtitle: 'Our curricula and certifications are recognized worldwide by top industry organizations and institutions.',
          badge: 'Accreditation & Partners',
          enabled: true,
          order: 0,
          layout: 'standard',
          background: { type: 'theme_light' },
          padding: 'compact',
          content: {
            title: 'Accredited by Global Authorities & Industry Leaders',
            subtitle: 'Our curricula and certifications are recognized worldwide by top industry organizations and institutions.',
            badge: 'Trusted Worldwide',
            showHeadline: true,
            displayStyle: 'monochrome',
            tickerSpeed: 'normal',
            direction: 'left',
            pauseOnHover: true,
            showLogoText: true,
            itemGap: 'standard',
            containerWidth: 'standard',
            grayscale: true,
            partners: [
              { id: 'p1', name: 'logoipsum', svgType: 'radar', category: 'Technology' },
              { id: 'p2', name: 'logoipsum', svgType: 'waves', category: 'Standards' },
              { id: 'p3', name: 'logoipsum', svgType: 'cube', category: 'Accreditation' },
              { id: 'p4', name: 'logoipsum', svgType: 'split', category: 'Healthcare' },
              { id: 'p5', name: 'logoipsum', svgType: 'nodes', category: 'Cloud Infrastructure' },
              { id: 'p6', name: 'logoipsum', svgType: 'shield', category: 'Security' }
            ]
          } as PartnersTickerContent
        };
        break;

      case 'latest_news':
        newSection = {
          id: newId,
          type: 'latest_news',
          title: 'Latest News & Insights',
          subtitle: 'Stay updated with executive summaries, research papers, and platform announcements.',
          badge: 'Insights',
          enabled: true,
          order: 0,
          layout: 'standard',
          background: { type: 'neutral' },
          padding: 'spacious',
          content: {
            displayCount: 3,
            enableSubscribeNewsletter: true,
            items: [
              {
                id: 'news-1',
                title: '2026 Global Workforce Learning Trends Report Released',
                excerpt: 'Discover how AI-assisted skill cluster mapping and micro-credentials are revolutionizing enterprise talent mobility.',
                category: 'Research Report',
                date: 'September 15, 2026',
                author: 'Dr. Sarah Sterling',
                authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100',
                imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600',
                readTime: '5 min read',
                tag: 'Industry'
              }
            ]
          } as LatestNewsContent
        };
        break;

      case 'about_us':
        newSection = {
          id: newId,
          type: 'about_us',
          title: `About ${lmsName}`,
          subtitle: 'Our story, mission, and dedication to accessible, high-impact enterprise education.',
          badge: 'Our Mission',
          enabled: true,
          order: 0,
          layout: 'split',
          background: { type: 'theme_light' },
          padding: 'spacious',
          content: {
            missionTitle: 'Bridging the Global Competency Gap with Next-Generation Learning Infrastructure',
            missionText: `${lmsName} was established to eliminate fragmented learning silos and provide an institutional-grade portal for continuous upskilling.`,
            visionText: 'We envision a future where high-quality technical and leadership education is seamlessly accessible and verifiable.',
            pillars: [
              { icon: 'military_tech', title: 'Rigorous Academic Quality', description: 'Dual peer review by domain practitioners and instructional architects.' },
              { icon: 'security', title: 'Enterprise Governance', description: 'Multi-role access controls, SSO integration, and ISO 27001 compliant residency.' }
            ],
            achievementStats: [
              { value: '14+', label: 'Years of Excellence', icon: 'history_edu' },
              { value: '99.4%', label: 'Learner Satisfaction', icon: 'sentiment_very_satisfied' }
            ],
            image1Url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800'
          } as AboutUsContent
        };
        break;

      case 'contact_form':
        newSection = {
          id: newId,
          type: 'contact_form',
          title: 'Get in Touch with Our Academic Advisors',
          subtitle: 'Have questions about enterprise cohort enrollments, custom curriculum authoring, or LMS integration? We are here to help.',
          badge: 'Direct Connect',
          enabled: true,
          order: 0,
          layout: 'split',
          background: { type: 'neutral' },
          padding: 'spacious',
          content: {
            heading: 'We’d Love to Hear From You',
            description: 'Fill out the form and our advisory team will respond within 24 business hours.',
            email: 'admissions@enterprise-lms.net',
            phone: '+1 (800) 555-0199',
            address: '75 Mohakhali, Dhaka 1212 / Global Innovation Hub',
            workingHours: 'Monday – Friday: 08:00 AM – 07:00 PM (UTC)',
            subjectOptions: [
              'General Inquiries & Admissions',
              'Enterprise Team License & Multi-Tenant Setup',
              'Custom Course Authoring & SCORM Import'
            ],
            enableMapOrGraphic: true,
            successMessage: 'Thank you for reaching out! Your inquiry has been dispatched to our advisory team.'
          } as ContactFormContent
        };
        break;

      case 'faq_accordion':
        newSection = {
          id: newId,
          type: 'faq_accordion',
          title: 'Frequently Asked Questions',
          subtitle: 'Everything you need to know about accessing courses and earning certificates.',
          badge: 'Knowledge Base',
          enabled: true,
          order: 0,
          layout: 'centered',
          background: { type: 'theme_light' },
          padding: 'spacious',
          content: {
            faqs: [
              {
                id: 'faq-1',
                question: 'How do I access my enrolled courses and classroom materials?',
                answer: 'Once you sign in to the portal via SSO or email credentials, all active courses are immediately accessible in your Learner Dashboard.'
              },
              {
                id: 'faq-2',
                question: 'Are the digital certificates verifiable?',
                answer: 'Yes. Every issued certificate includes a unique cryptographic verification hash and OpenBadges 2.0 metadata.'
              }
            ]
          } as FaqAccordionContent
        };
        break;

      case 'cta_banner':
      default:
        newSection = {
          id: newId,
          type: 'cta_banner',
          title: 'Ready to Accelerate Your Career?',
          subtitle: 'Join over 45,000 active learners and start earning recognized credentials today.',
          badge: 'Start Today',
          enabled: true,
          order: 0,
          layout: 'centered',
          background: { type: 'theme_gradient' },
          padding: 'spacious',
          content: {
            title: 'Start Learning Today and Unlock Certified Excellence',
            subtitle: 'Create your account or log in via your organization SSO to access comprehensive course modules.',
            ctaText: 'Access Learner Portal',
            ctaAction: '/login',
            badgeText: 'Instant Digital Access',
            backgroundStyle: 'gradient'
          } as CtaBannerContent
        };
        break;
    }

    const sections = [...this.pageConfig().sections];
    const insertIdx = this.insertSectionAtIndex();

    if (insertIdx >= 0 && insertIdx <= sections.length) {
      sections.splice(insertIdx, 0, newSection);
    } else {
      sections.push(newSection);
    }

    sections.forEach((s, idx) => s.order = idx);
    this.updatePageConfig({ sections });

    this.showAddSectionModal.set(false);
    this.selectSection(newId);
    this.lms.showToast(`Added new ${newSection.title} section`, 'success', 2500, 'Section Added');
  }

  // Update Page Configuration
  updatePageConfig(partial: Partial<LandingPageConfig>): void {
    const updated: LandingPageConfig = {
      ...this.pageConfig(),
      ...partial,
      lastUpdatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    this.pageConfig.set(updated);
    this.pushHistoryState(updated);
  }

  updateSelectedSection(partial: Partial<LandingSection>): void {
    const cur = this.selectedSection();
    if (!cur) return;

    const sections = this.pageConfig().sections.map(s => {
      if (s.id === cur.id) {
        return { ...s, ...partial };
      }
      return s;
    });

    this.updatePageConfig({ sections });
    if (cur.type === 'carousel_slider') {
      this.initCarouselConfig();
    }
  }

  // Save Draft
  saveDraft(): void {
    this.lms.saveLandingPage(this.pageConfig());
    this.api.updateLandingPage(this.activeLmsId(), this.pageConfig()).subscribe({
      next: () => {
        this.lms.showToast('Draft synchronized with server database', 'success', 2500, 'Server Sync');
      },
      error: () => {
        this.lms.showToast('Draft saved locally in workspace', 'info', 2000, 'Local Save');
      }
    });
  }

  // Publish Live
  publishLive(): void {
    this.lms.publishLandingPageConfig(this.pageConfig());
    this.api.publishLandingPage(this.activeLmsId()).subscribe({
      next: (res) => {
        if (res) {
          this.pageConfig.set(res);
        }
        this.seo.updateLandingPageSeo(this.pageConfig());
        this.lms.showToast(`Landing page published live for ${this.pageConfig().lmsName}!`, 'success', 4000, 'Published');
      },
      error: () => {
        this.seo.updateLandingPageSeo(this.pageConfig());
        this.lms.showToast('Landing page published to local portal!', 'success', 3500, 'Published');
      }
    });
  }

  // Reset to Theme Defaults
  confirmReset(): void {
    const fresh = this.lms.resetLandingPageForLms(this.activeLmsId());
    this.pageConfig.set(fresh);
    this.pushHistoryState(fresh);
    this.showResetConfirmModal.set(false);
    this.api.resetLandingPage(this.activeLmsId()).subscribe();
  }

  // Templates
  applyTemplate(templateName: string): void {
    const lmsName = this.pageConfig().lmsName;
    const fresh = createDefaultLandingPage(
      this.activeLmsId(),
      this.pageConfig().tenantId,
      lmsName,
      this.pageConfig().navbar.siteTitle,
      this.lmsLogo(),
      this.primaryColor(),
      this.accentColor()
    );

    if (templateName === 'cybersecurity') {
      fresh.seo.pageTitle = `${lmsName} — Cybersecurity & SOC-2 Compliance Academy`;
      fresh.navbar.announcementText = '🛡️ ISO 27001 / SOC-2 2026 Audit Readiness cohorts now open for team registration.';
      const hero = fresh.sections.find(s => s.type === 'hero_banner');
      if (hero) {
        hero.content.headline = `Enterprise Cybersecurity & Threat Governance`;
        hero.content.subheadline = 'Equip SecOps and Cloud teams with hands-on red team labs, vulnerability analysis, and ISO 27001 certifications.';
        hero.content.badgeText = '🔒 SOC-2 & ISO 27001 Compliant';
      }
    } else if (templateName === 'healthcare') {
      fresh.seo.pageTitle = `${lmsName} — Clinical Healthcare & Regulatory Academy`;
      fresh.navbar.announcementText = '🏥 FDA 21 CFR & GCP 2026 recertification modules now available with automated compliance logging.';
      const hero = fresh.sections.find(s => s.type === 'hero_banner');
      if (hero) {
        hero.content.headline = `Clinical Excellence & Bioethics Governance`;
        hero.content.subheadline = 'Accredited healthcare pathways, clinical trial bioethics, and mandatory institutional compliance.';
        hero.content.badgeText = '🩺 HIPAA & GCP Accredited';
      }
    } else if (templateName === 'tech_bootcamp') {
      fresh.seo.pageTitle = `${lmsName} — Full-Stack AI & Cloud Engineering Academy`;
      fresh.navbar.announcementText = '⚡ Next-Gen LLM Architectures & Production Kubernetes Bootcamps start next Monday.';
      const hero = fresh.sections.find(s => s.type === 'hero_banner');
      if (hero) {
        hero.content.headline = `Build Scalable Production AI Systems`;
        hero.content.subheadline = 'Learn modern multi-agent systems, real-time streaming architectures, and distributed systems from top engineers.';
        hero.content.badgeText = '🚀 100% Practical Interactive Labs';
      }
    }

    this.pageConfig.set(fresh);
    this.pushHistoryState(fresh);
    this.showTemplatesModal.set(false);
    this.lms.showToast(`Applied "${templateName}" template preset`, 'success', 2500, 'Template Loaded');
  }

  // Interactive Preview Controls
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

  toggleFaq(id: string): void {
    this.faqOpenMap.update(map => ({
      ...map,
      [id]: !map[id]
    }));
  }

  onPreviewContactSubmit(): void {
    this.contactSubmitting.set(true);
    this.api.submitLandingContact(this.activeLmsId(), this.contactForm).subscribe({
      next: (res) => {
        this.contactSubmitting.set(false);
        this.contactSubmitted.set(true);
        this.lms.showToast(res.message || 'Inquiry sent!', 'success', 3500, 'Message Sent');
      },
      error: () => {
        this.contactSubmitting.set(false);
        this.contactSubmitted.set(true);
        this.lms.showToast('Inquiry received! Our team will get back to you shortly.', 'success', 3500, 'Demo Inquiry Sent');
      }
    });
  }

  onPreviewNewsletterSubmit(): void {
    const email = this.newsletterEmail().trim();
    if (!email || !email.includes('@')) {
      this.lms.showToast('Please enter a valid email address', 'error', 2500);
      return;
    }
    this.api.submitLandingNewsletter(this.activeLmsId(), email).subscribe({
      next: (res) => {
        this.newsletterSubmitted.set(true);
        this.lms.showToast(res.message || 'Subscribed successfully!', 'success', 3000, 'Newsletter');
      },
      error: () => {
        this.newsletterSubmitted.set(true);
        this.lms.showToast('Subscribed to executive briefings!', 'success', 3000, 'Subscribed');
      }
    });
  }

  // Helper formatting & schema JSON
  getSchemaJson(): string {
    const cfg = this.pageConfig();
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': cfg.seo?.schemaType || 'EducationalOrganization',
      'name': cfg.lmsName,
      'description': cfg.seo?.metaDescription,
      'url': cfg.seo?.canonicalUrl,
      'logo': cfg.navbar?.logoOverride || this.lmsLogo(),
      'sameAs': cfg.footer?.socialLinks?.map(s => s.url) || []
    }, null, 2);
  }

  getPageJson(): string {
    return JSON.stringify(this.pageConfig(), null, 2);
  }

  copyToClipboard(text: string, label: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.lms.showToast(`${label} copied to clipboard!`, 'info', 2000, 'Copied');
    }
  }

  // Course Image helpers
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

  // Navbar link management
  addNavbarLink(): void {
    const cfg = this.pageConfig();
    const links = [...cfg.navbar.links, {
      id: `link-${Date.now().toString().slice(-4)}`,
      label: 'New Link',
      target: '#courses',
      type: 'scroll' as const,
      openInNewTab: false
    }];
    this.updatePageConfig({
      navbar: { ...cfg.navbar, links }
    });
  }

  removeNavbarLink(index: number): void {
    const cfg = this.pageConfig();
    const links = cfg.navbar.links.filter((_, idx) => idx !== index);
    this.updatePageConfig({
      navbar: { ...cfg.navbar, links }
    });
  }

  // Footer link & column management
  addFooterColumn(): void {
    const cfg = this.pageConfig();
    const columns = [...cfg.footer.columns, {
      title: 'New Column',
      links: [
        { label: 'Overview', url: '#' },
        { label: 'Documentation', url: '#' }
      ]
    }];
    this.updatePageConfig({
      footer: { ...cfg.footer, columns }
    });
  }

  removeFooterColumn(index: number): void {
    const cfg = this.pageConfig();
    const columns = cfg.footer.columns.filter((_, idx) => idx !== index);
    this.updatePageConfig({
      footer: { ...cfg.footer, columns }
    });
  }

  addFooterLink(colIndex: number): void {
    const cfg = this.pageConfig();
    const columns = cfg.footer.columns.map((col, idx) => {
      if (idx === colIndex) {
        return {
          ...col,
          links: [...col.links, { label: 'New Link', url: '#' }]
        };
      }
      return col;
    });
    this.updatePageConfig({
      footer: { ...cfg.footer, columns }
    });
  }

  addSocialLink(): void {
    const cfg = this.pageConfig();
    const current = cfg.footer.socialLinks || [];
    const socialLinks = [...current, { platform: 'linkedin' as const, url: 'https://linkedin.com' }];
    this.updatePageConfig({
      footer: { ...cfg.footer, socialLinks }
    });
  }

  removeSocialLink(index: number): void {
    const cfg = this.pageConfig();
    const socialLinks = (cfg.footer.socialLinks || []).filter((_, idx) => idx !== index);
    this.updatePageConfig({
      footer: { ...cfg.footer, socialLinks }
    });
  }

  // Legal Modals in Preview
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

  // Toggle hero search and auto-ensure courses grid is enabled
  onToggleHeroSearch(sec: LandingSection, enabled: boolean): void {
    sec.content.showSearchBox = enabled;
    if (enabled) {
      const coursesSec = this.pageConfig().sections.find(s => s.type === 'courses_grid');
      if (coursesSec) {
        if (!coursesSec.enabled) {
          coursesSec.enabled = true;
          this.lms.showToast('Course Grid section automatically enabled to display search results.', 'info', 2500, 'Search Connected');
        }
      } else {
        const defaultCourses: LandingSection = {
          id: 'courses',
          type: 'courses_grid',
          title: 'Featured Curriculum & Accredited Courses',
          subtitle: 'Explore industry-recognized credentials, compliance modules, and hands-on skill labs.',
          badge: 'Course Catalog',
          enabled: true,
          order: 2,
          layout: 'standard',
          background: { type: 'neutral' },
          padding: 'standard',
          content: {
            sectionTagline: 'Self-paced and instructor-led cohorts',
            filterCategories: ['All Categories', 'Artificial Intelligence', 'Cybersecurity', 'Cloud Architecture', 'Compliance & Risk'],
            displayCount: 6,
            columns: 3,
            showPrice: true,
            showRating: true,
            showEnrollButton: true,
            enrollButtonText: 'Enroll Now',
            enrollButtonAction: 'modal',
            showLevelBadge: true,
            showInstructor: true
          }
        };
        this.pageConfig.update(cfg => ({
          ...cfg,
          sections: [...cfg.sections, defaultCourses]
        }));
        this.lms.showToast('Course Grid section created and enabled for search results.', 'info', 2500, 'Search Connected');
      }
    }
    this.updateSelectedSection({ content: sec.content });
  }

  onHeroSearchSubmit(): void {
    this.navigateToSection('#courses');
  }

  resetCourseFilters(): void {
    this.courseSearchQuery.set('');
    this.selectedCategory.set('All Categories');
  }

  navigateToSection(target: string): void {
    if (!target) return;
    if (target.startsWith('#')) {
      const secId = target.substring(1);
      this.activeNavSection.set(target);
      const sec = this.pageConfig().sections.find(s => s.id === secId || s.type === secId || s.type.startsWith(secId));
      if (sec) {
        this.selectedSectionId.set(sec.id);
        const el = document.getElementById(`builder-section-${sec.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        const directEl = document.getElementById(`builder-section-${secId}`) || document.getElementById(secId);
        if (directEl) {
          directEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    } else if (target.startsWith('http://') || target.startsWith('https://')) {
      if (typeof window !== 'undefined') {
        window.open(target, '_blank', 'noopener,noreferrer');
      }
    } else {
      const clean = target.replace(/^\//, '');
      const sec = this.pageConfig().sections.find(s => s.id === clean || s.type === clean || s.type.startsWith(clean));
      if (sec) {
        this.activeNavSection.set('#' + sec.id);
        this.selectedSectionId.set(sec.id);
        const el = document.getElementById(`builder-section-${sec.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  }

  isLinkActive(link: any): boolean {
    if (!link || !link.target) return false;
    const active = this.activeNavSection();
    if (link.target === active) return true;
    const cleanTarget = link.target.replace(/^#/, '');
    const cleanActive = active.replace(/^#/, '');
    return cleanTarget === cleanActive || (this.selectedSectionId() === cleanTarget);
  }

  // Video Tour Modal State in Preview
  videoTourModalOpen = signal<boolean>(false);
  videoTourUrl = signal<string>('https://www.youtube.com/embed/dQw4w9WgXcQ');

  openVideoTour(url?: string): void {
    if (url) {
      this.videoTourUrl.set(url);
    }
    this.videoTourModalOpen.set(true);
  }

  closeVideoTour(): void {
    this.videoTourModalOpen.set(false);
  }

  handleHeroSecondaryCta(heroContent: any): void {
    const actionType = heroContent?.secondaryCtaActionType || 'video_modal';

    if (actionType === 'video_modal') {
      const url = heroContent?.videoModalUrl || heroContent?.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      this.openVideoTour(url);
      return;
    }

    if (actionType === 'route_link' || actionType === 'route') {
      const target = heroContent?.secondaryCtaAction || '/courses';
      this.lms.showToast(`Navigating to ${target} (Preview mode)`, 'info', 2000, 'Internal Route');
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
        const el = document.getElementById(`builder-section-${target.substring(1)}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        // Fallback to video tour modal if target section is not in current layout
        this.openVideoTour(heroContent?.videoModalUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ');
      }
    }
  }

  // Hero Stat Chips Management
  addHeroStatChip(): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'hero_banner') return;
    const currentChips = sec.content.statChips || [];
    const newChip: HeroStatChip = {
      id: `stat-${Date.now().toString().slice(-4)}`,
      value: '100+',
      label: 'New Metric',
      icon: 'workspace_premium'
    };
    const statChips = [...currentChips, newChip];
    this.updateSelectedSection({
      content: { ...sec.content, statChips }
    });
  }

  removeHeroStatChip(index: number): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'hero_banner') return;
    const statChips = (sec.content.statChips || []).filter((_: any, idx: number) => idx !== index);
    this.updateSelectedSection({
      content: { ...sec.content, statChips }
    });
  }

  setHeroStatIcon(statIndex: number, iconName: string): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'hero_banner' || !sec.content.statChips) return;
    const statChips = sec.content.statChips.map((s: HeroStatChip, idx: number) => {
      if (idx === statIndex) {
        return { ...s, icon: iconName };
      }
      return s;
    });
    this.updateSelectedSection({
      content: { ...sec.content, statChips }
    });
  }

  onSecondaryCtaActionTypeChange(actionType: string): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'hero_banner') return;

    const content = { ...sec.content, secondaryCtaActionType: actionType };

    // Intelligently initialize corresponding relational values if not already populated
    if (actionType === 'video_modal') {
      if (!content.videoModalUrl) {
        content.videoModalUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      }
    } else if (actionType === 'scroll') {
      if (!content.secondaryCtaAction || !content.secondaryCtaAction.startsWith('#')) {
        content.secondaryCtaAction = '#video';
      }
    } else if (actionType === 'route_link') {
      if (!content.secondaryCtaAction || content.secondaryCtaAction.startsWith('#')) {
        content.secondaryCtaAction = '/courses';
      }
    } else if (actionType === 'external_url') {
      if (!content.secondaryCtaAction || (!content.secondaryCtaAction.startsWith('http://') && !content.secondaryCtaAction.startsWith('https://'))) {
        content.secondaryCtaAction = 'https://example.com/demo';
      }
    }

    this.updateSelectedSection({ content });
  }

  // Video Showcase management
  addVideoBullet(): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'video_showcase') return;
    const bulletPoints = [...(sec.content.bulletPoints || []), 'Interactive microlearning lessons and real-time assessments'];
    this.updateSelectedSection({
      content: { ...sec.content, bulletPoints }
    });
  }

  removeVideoBullet(index: number): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'video_showcase') return;
    const bulletPoints = (sec.content.bulletPoints || []).filter((_: any, idx: number) => idx !== index);
    this.updateSelectedSection({
      content: { ...sec.content, bulletPoints }
    });
  }

  moveVideoBullet(index: number, direction: 'up' | 'down'): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'video_showcase') return;
    const bulletPoints = [...(sec.content.bulletPoints || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= bulletPoints.length) return;
    const temp = bulletPoints[index];
    bulletPoints[index] = bulletPoints[targetIdx];
    bulletPoints[targetIdx] = temp;
    this.updateSelectedSection({
      content: { ...sec.content, bulletPoints }
    });
  }

  addVideoStat(): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'video_showcase') return;
    const statsList = [...(sec.content.statsList || []), { label: 'New Metric', value: '100%' }];
    this.updateSelectedSection({
      content: { ...sec.content, statsList }
    });
  }

  removeVideoStat(index: number): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'video_showcase') return;
    const statsList = (sec.content.statsList || []).filter((_: any, idx: number) => idx !== index);
    this.updateSelectedSection({
      content: { ...sec.content, statsList }
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
        params.push('mute=1'); // required by browsers for autoplay
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

  // Slide management for carousel
  addSlide(): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'carousel_slider') return;
    const slides = [...(sec.content.slides || []), {
      id: `slide-${Date.now().toString().slice(-4)}`,
      title: 'New Cohort or Certificate',
      subtitle: 'Describe the key learning outcome or program benefit here.',
      badge: 'New Module',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200',
      ctaText: 'Explore Module',
      ctaAction: '#courses',
      category: 'General'
    }];
    this.updateSelectedSection({
      content: { ...sec.content, slides }
    });
  }

  removeSlide(index: number): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'carousel_slider') return;
    const slides = (sec.content.slides || []).filter((_: any, idx: number) => idx !== index);
    this.updateSelectedSection({
      content: { ...sec.content, slides }
    });
  }

  moveSlide(index: number, direction: 'up' | 'down'): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'carousel_slider') return;
    const slides = [...(sec.content.slides || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;

    const temp = slides[index];
    slides[index] = slides[targetIdx];
    slides[targetIdx] = temp;

    this.updateSelectedSection({
      content: { ...sec.content, slides }
    });
  }

  duplicateSlide(index: number): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'carousel_slider') return;
    const slides = [...(sec.content.slides || [])];
    if (!slides[index]) return;
    const cloned = JSON.parse(JSON.stringify(slides[index]));
    cloned.id = `slide-${Date.now().toString().slice(-4)}`;
    cloned.title = `${cloned.title} (Copy)`;
    slides.splice(index + 1, 0, cloned);

    this.updateSelectedSection({
      content: { ...sec.content, slides }
    });
  }

  // FAQ item management
  addFaq(): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'faq_accordion') return;
    const faqs = [...(sec.content.faqs || []), {
      id: `faq-${Date.now().toString().slice(-4)}`,
      question: 'What is the refund and accreditation policy?',
      answer: 'All enrolled learners receive 14-day risk-free access and instantly verifiable digital credentials upon passing all evaluations.'
    }];
    this.updateSelectedSection({
      content: { ...sec.content, faqs }
    });
  }

  removeFaq(index: number): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'faq_accordion') return;
    const faqs = (sec.content.faqs || []).filter((_: any, idx: number) => idx !== index);
    this.updateSelectedSection({
      content: { ...sec.content, faqs }
    });
  }

  // Instructor management
  addInstructor(): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'instructors_directory') return;
    const instructors = [...(sec.content.instructors || []), {
      id: `inst-${Date.now().toString().slice(-4)}`,
      name: 'Dr. Jane Smith',
      title: 'Senior Fellow & Lead Architect',
      department: 'Cloud & AI Systems',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200',
      bio: 'Over 15 years leading enterprise engineering teams and authoring ISO standards.',
      rating: 4.95,
      coursesCount: 6,
      studentsCount: '12,500+',
      specialties: ['AI Architecture', 'Distributed Systems']
    }];
    this.updateSelectedSection({
      content: { ...sec.content, instructors }
    });
  }

  removeInstructor(index: number): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'instructors_directory') return;
    const instructors = (sec.content.instructors || []).filter((_: any, idx: number) => idx !== index);
    this.updateSelectedSection({
      content: { ...sec.content, instructors }
    });
  }

  // News item management
  addNewsItem(): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'latest_news') return;
    const items = [...(sec.content.items || []), {
      id: `news-${Date.now().toString().slice(-4)}`,
      title: 'New Enterprise Skill Standards Published',
      excerpt: 'Comprehensive roadmap detailing compliance and generative AI competency milestones for 2026.',
      category: 'Curriculum Update',
      date: 'Today',
      author: 'Academic Council',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600',
      readTime: '4 min read'
    }];
    this.updateSelectedSection({
      content: { ...sec.content, items }
    });
  }

  removeNewsItem(index: number): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'latest_news') return;
    const items = (sec.content.items || []).filter((_: any, idx: number) => idx !== index);
    this.updateSelectedSection({
      content: { ...sec.content, items }
    });
  }

  // Testimonial management
  addTestimonial(): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'testimonials') return;
    const testimonials = [...(sec.content.testimonials || []), {
      id: `test-${Date.now().toString().slice(-4)}`,
      name: 'Alex Morgan',
      role: 'Head of Engineering',
      organization: 'FinTech Corp',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
      comment: 'The verifiable credentials and real-time labs significantly accelerated our engineering compliance onboarding.',
      rating: 5,
      verified: true
    }];
    this.updateSelectedSection({
      content: { ...sec.content, testimonials }
    });
  }

  removeTestimonial(index: number): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'testimonials') return;
    const testimonials = (sec.content.testimonials || []).filter((_: any, idx: number) => idx !== index);
    this.updateSelectedSection({
      content: { ...sec.content, testimonials }
    });
  }

  // Partner management
  addPartner(): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'partners_ticker') return;
    const svgPresets: Array<'radar' | 'waves' | 'cube' | 'split' | 'nodes' | 'shield' | 'spark' | 'infinity'> = [
      'radar', 'waves', 'cube', 'split', 'nodes', 'shield', 'spark', 'infinity'
    ];
    const nextSvg = svgPresets[(sec.content.partners?.length || 0) % svgPresets.length];
    const partners = [...(sec.content.partners || []), {
      id: `part-${Date.now().toString().slice(-4)}`,
      name: 'logoipsum',
      svgType: nextSvg,
      category: 'Enterprise Alliance'
    }];
    this.updateSelectedSection({
      content: { ...sec.content, partners }
    });
  }

  getTickerSpeedSeconds(speed?: string): string {
    switch (speed) {
      case 'fast': return '15s';
      case 'slow': return '42s';
      case 'normal':
      default: return '26s';
    }
  }

  removePartner(index: number): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'partners_ticker') return;
    const partners = (sec.content.partners || []).filter((_: any, idx: number) => idx !== index);
    this.updateSelectedSection({
      content: { ...sec.content, partners }
    });
  }

  // Pillar management for about_us
  addPillar(): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'about_us') return;
    const pillars = [...(sec.content.pillars || []), {
      icon: 'school',
      title: 'Pedagogical Excellence',
      description: 'Courses designed with evidence-based cognitive retention models and interactive milestones.'
    }];
    this.updateSelectedSection({
      content: { ...sec.content, pillars }
    });
  }

  removePillar(index: number): void {
    const sec = this.selectedSection();
    if (!sec || sec.type !== 'about_us') return;
    const pillars = (sec.content.pillars || []).filter((_: any, idx: number) => idx !== index);
    this.updateSelectedSection({
      content: { ...sec.content, pillars }
    });
  }

  exitBuilder(): void {
    this.router.navigate(['/settings']);
  }

  openLivePublicPage(): void {
    const url = `/landing/${this.activeLmsId()}`;
    window.open(url, '_blank');
  }

  // Keyboard Shortcuts for Undo/Redo & Save (Handled via Component host binding)
  handleKeyboardShortcuts(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
      if (event.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
      event.preventDefault();
    } else if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      this.saveDraft();
      event.preventDefault();
    }
  }
}
