export type LandingSectionType =
  | 'hero_banner'
  | 'video_showcase'
  | 'carousel_slider'
  | 'courses_grid'
  | 'latest_news'
  | 'instructors_directory'
  | 'testimonials'
  | 'partners_ticker'
  | 'about_us'
  | 'contact_form'
  | 'faq_accordion'
  | 'cta_banner';

export type BackgroundStyleType =
  | 'theme_gradient'
  | 'theme_light'
  | 'neutral'
  | 'dark'
  | 'image'
  | 'pattern';

export interface LandingNavLink {
  id: string;
  label: string;
  type: 'scroll' | 'route' | 'external';
  target: string; // e.g. '#courses', '#instructors', '/courses', 'https://...'
  badge?: string;
}

export interface LandingNavbarConfig {
  logoOverride?: string;
  siteTitle?: string;
  sticky: boolean;
  style: 'glass' | 'solid' | 'transparent' | 'dark';
  links: LandingNavLink[];
  ctaButton: {
    label: string;
    action: 'scroll' | 'route' | 'login' | 'external';
    target: string;
    variant: 'primary' | 'outline' | 'gradient';
    enabled: boolean;
  };
  showAnnouncementBar: boolean;
  announcementText: string;
  announcementLink?: string;
  announcementType: 'info' | 'highlight' | 'urgent';
}

export interface HeroStatChip {
  id: string;
  value: string;
  label: string;
  icon: string;
}

export interface HeroBannerContent {
  headline: string;
  subheadline: string;
  badgeText: string;
  badgeIcon?: string;
  primaryCtaText: string;
  primaryCtaAction: string;
  secondaryCtaText: string;
  secondaryCtaAction: string;
  secondaryCtaActionType?: 'video_modal' | 'scroll' | 'route' | 'link';
  videoModalUrl?: string;
  showSecondaryCta?: boolean;
  heroMedia: 'image' | 'badge_cluster' | 'search_box' | 'interactive_card';
  heroImageUrl: string;
  searchPlaceholder?: string;
  statChips: HeroStatChip[];
  showSearchBox?: boolean;
  // Hero Interactive Card / Graphic Context Overlays
  cardBadgeText?: string;
  cardBadgeColor?: 'emerald' | 'amber' | 'pink' | 'sky' | 'indigo' | 'rose';
  cardBadgePulse?: boolean;
  cardBadgeIcon?: string;
  cardTitle?: string;
  cardDescription?: string;
  showCardOverlay?: boolean;
  cardActionText?: string;
  cardActionUrl?: string;
}

export type VideoShowcaseMode = 'banner' | 'split_walkthrough' | 'cinematic_centered';
export type VideoBannerHeight = 'compact' | 'standard' | 'cinematic' | 'screen';
export type VideoBannerOverlay = 'none' | 'gradient_bottom' | 'glass_card' | 'centered_hero';

export interface VideoShowcaseContent {
  // Mode & Layout
  useAsBanner?: boolean; // When true or mode === 'banner', video takes the whole place (no side content)
  mode?: VideoShowcaseMode; // 'banner' | 'split_walkthrough' | 'cinematic_centered'
  splitOrientation?: 'video_left' | 'video_right';
  aspectRatio?: '16:9' | '21:9' | '4:3' | 'custom';
  bannerHeight?: VideoBannerHeight; // 'compact', 'standard', 'cinematic', 'screen'
  bannerOverlay?: VideoBannerOverlay; // 'none', 'gradient_bottom', 'glass_card', 'centered_hero'
  containerWidth?: 'container' | 'full_bleed';

  // Video Source & Playback
  videoUrl: string; // YouTube, Vimeo, or direct MP4 URL
  posterUrl: string; // Poster thumbnail image
  videoTitle: string;
  badgeText?: string;
  durationText?: string;
  autoPlay: boolean; // Autoplay toggle
  muted?: boolean; // Default true when autoplay enabled
  loop?: boolean; // Loop playback
  showControls?: boolean; // Player controls visibility

  // Split Walkthrough / Banner Content Details
  description?: string;
  bulletPoints: string[];
  statsList: Array<{ label: string; value: string }>;
  
  // Call to Action Buttons
  primaryCtaText?: string;
  primaryCtaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;

  // Banner Overlay Specific Text (optional overrides)
  bannerOverlayBadge?: string;
  bannerOverlayTitle?: string;
  bannerOverlaySubtitle?: string;
}

export type CarouselVariant = 
  | 'depth_coverflow'    // 3D perspective center-stage cards with progress scrubber
  | 'split_editorial'    // Magazine-style split hero with large typography & visual card
  | 'card_deck_row'      // Multi-card horizontal deck with category tags & spring slides
  | 'cinematic_hero'     // Full-bleed visual backdrop with gradient scrim & floating caption
  | 'timeline_scrubber'; // Bottom animated milestone scrubber bar

export interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  badge?: string;
  ctaText?: string;
  ctaAction?: string;
  overlayStyle?: 'dark' | 'gradient' | 'minimal';
  dateLabel?: string;
  category?: string;
}

export interface CarouselSliderContent {
  variant?: CarouselVariant;
  autoPlayIntervalMs?: number;
  autoPlayInterval?: number;
  autoPlay?: boolean;
  showDots?: boolean;
  showArrows?: boolean;
  showTimelineBar?: boolean;
  slides: CarouselSlide[];
}

export interface CoursesGridContent {
  sectionTagline: string;
  filterCategories: string[];
  displayCount: number;
  columns: 2 | 3 | 4;
  showPrice: boolean;
  showRating: boolean;
  showEnrollButton: boolean;
  enrollButtonText?: string;
  enrollButtonAction?: 'modal' | 'route' | 'login';
  showLevelBadge?: boolean;
  showInstructor?: boolean;
  featuredCourseIds?: string[];
  viewAllLink?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  author: string;
  authorAvatar: string;
  imageUrl: string;
  readTime: string;
  tag: string;
  contentBody?: string;
}

export interface LatestNewsContent {
  displayCount: number;
  items: NewsItem[];
  enableSubscribeNewsletter?: boolean;
  newsletterHeadline?: string;
  newsletterSubtext?: string;
}

export interface InstructorItem {
  id: string;
  name: string;
  title: string;
  department: string;
  bio: string;
  avatarUrl: string;
  rating: number;
  coursesCount: number;
  studentsCount: string;
  specialties: string[];
  socialLinkedin?: string;
  socialTwitter?: string;
  email?: string;
}

export interface InstructorsDirectoryContent {
  displayCount: number;
  layout: 'cards' | 'carousel' | 'compact' | 'split';
  instructors: InstructorItem[];
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  organization: string;
  avatarUrl: string;
  rating: number;
  comment: string;
  verified: boolean;
  courseTaken?: string;
}

export interface TestimonialsContent {
  layout: 'grid' | 'carousel' | 'cards';
  testimonials: TestimonialItem[];
}

export interface PartnerItem {
  id: string;
  name: string;
  logoUrl?: string;
  svgType?: 'radar' | 'waves' | 'cube' | 'split' | 'nodes' | 'shield' | 'spark' | 'infinity';
  category?: string;
  url?: string;
}

export interface PartnersTickerContent {
  title?: string;
  subtitle?: string;
  badge?: string;
  showHeadline?: boolean;
  displayStyle?: 'monochrome' | 'soft_contrast' | 'original_color';
  tickerSpeed?: 'slow' | 'normal' | 'fast';
  direction?: 'left' | 'right';
  pauseOnHover?: boolean;
  showLogoText?: boolean;
  itemGap?: 'compact' | 'standard' | 'spacious';
  containerWidth?: 'standard' | 'full_bleed';
  grayscale?: boolean;
  partners: PartnerItem[];
}

export interface AboutUsContent {
  missionTitle: string;
  missionText: string;
  visionText: string;
  pillars: Array<{ icon: string; title: string; description: string }>;
  achievementStats: Array<{ value: string; label: string; icon: string }>;
  image1Url: string;
  image2Url?: string;
}

export interface ContactFormContent {
  heading: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  workingHours: string;
  subjectOptions: string[];
  enableMapOrGraphic: boolean;
  successMessage: string;
  showPhoneField?: boolean;
  showCompanyField?: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface FaqAccordionContent {
  faqs: FaqItem[];
  categories?: string[];
  allowSearch?: boolean;
}

export interface CtaBannerContent {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaAction: string;
  badgeText: string;
  backgroundStyle: string;
}

export interface LandingSection {
  id: string; // anchor id e.g. 'hero', 'video', 'courses', 'instructors'
  type: LandingSectionType;
  title: string;
  subtitle?: string;
  badge?: string;
  enabled: boolean;
  order: number;
  layout: 'standard' | 'centered' | 'split' | 'boxed' | 'fullwidth';
  background: {
    type: BackgroundStyleType;
    imageUrl?: string;
    overlayOpacity?: number;
  };
  padding: 'compact' | 'standard' | 'spacious';
  content: 
    | HeroBannerContent
    | VideoShowcaseContent
    | CarouselSliderContent
    | CoursesGridContent
    | LatestNewsContent
    | InstructorsDirectoryContent
    | TestimonialsContent
    | PartnersTickerContent
    | AboutUsContent
    | ContactFormContent
    | FaqAccordionContent
    | CtaBannerContent
    | any;
}

export interface LandingFooterColumn {
  title: string;
  links: Array<{ label: string; url: string; external?: boolean }>;
}

export interface LandingFooterConfig {
  brandSummary: string;
  copyrightText: string;
  showSocialLinks: boolean;
  socialLinks: Array<{ platform: 'linkedin' | 'twitter' | 'facebook' | 'youtube' | 'github'; url: string }>;
  columns: LandingFooterColumn[];
  showNewsletter: boolean;
  newsletterHeadline: string;
  newsletterSubtext: string;
  showLegalLinks: boolean;
  privacyUrl: string;
  termsUrl: string;
  cookiesUrl?: string;
  privacyLabel?: string;
  termsLabel?: string;
  cookiesLabel?: string;
}

export interface LandingSeoConfig {
  pageTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  ogImageUrl: string;
  canonicalUrl: string;
  schemaType: 'EducationalOrganization' | 'WebApplication' | 'Course';
  author: string;
  language: string;
}

export interface LandingPageConfig {
  id: string;
  lmsId: string;
  tenantId: string;
  lmsName: string;
  status: 'Published' | 'Draft';
  version: number;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
  seo: LandingSeoConfig;
  navbar: LandingNavbarConfig;
  sections: LandingSection[];
  footer: LandingFooterConfig;
}

/**
 * Creates initial default landing page setup for an LMS instance,
 * inheriting logo, branding colors, tagline and naming dynamically.
 */
export function createDefaultLandingPage(
  lmsId: string,
  tenantId: string,
  lmsName: string,
  tagline: string = '',
  logoUrl: string = '',
  primaryColor: string = '#EC008C',
  accentColor: string = '#005b94'
): LandingPageConfig {
  const safeName = lmsName || 'Enterprise LMS Academy';
  const safeTagline = tagline || 'Empowering global teams with accredited certifications, practical skills, and compliance pathways.';

  return {
    id: `landing-${lmsId}`,
    lmsId,
    tenantId,
    lmsName: safeName,
    status: 'Published',
    version: 1.0,
    lastUpdatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    lastUpdatedBy: 'System Administrator',
    seo: {
      pageTitle: `${safeName} — Official Learning Portal & Academy`,
      metaDescription: `${safeName}: ${safeTagline} Explore certified courses, expert instructors, and modern curriculum.`,
      metaKeywords: [safeName, 'Enterprise LMS', 'Online Learning', 'Accredited Certification', 'Workforce Training', 'Compliance'],
      ogImageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&h=630&q=85',
      canonicalUrl: `https://academy.enterprise.io/p/${lmsId}`,
      schemaType: 'EducationalOrganization',
      author: safeName,
      language: 'en'
    },
    navbar: {
      siteTitle: safeName,
      logoOverride: logoUrl,
      sticky: true,
      style: 'glass',
      links: [
        { id: 'nav-home', label: 'Home', type: 'scroll', target: '#hero' },
        { id: 'nav-courses', label: 'Courses', type: 'scroll', target: '#courses', badge: 'Popular' },
        { id: 'nav-video', label: 'Platform Tour', type: 'scroll', target: '#video' },
        { id: 'nav-instructors', label: 'Instructors', type: 'scroll', target: '#instructors' },
        { id: 'nav-news', label: 'Latest News', type: 'scroll', target: '#news' },
        { id: 'nav-about', label: 'About Us', type: 'scroll', target: '#about' },
        { id: 'nav-contact', label: 'Contact', type: 'scroll', target: '#contact' }
      ],
      ctaButton: {
        label: 'Sign In to Portal',
        action: 'login',
        target: '/login',
        variant: 'primary',
        enabled: true
      },
      showAnnouncementBar: true,
      announcementText: '🚀 Spring 2026 Course Catalogs and Certifications are now live! Enroll today to claim early bird credentials.',
      announcementLink: '#courses',
      announcementType: 'highlight'
    },
    sections: [
      // 1. Welcome Banner / Hero
      {
        id: 'hero',
        type: 'hero_banner',
        title: 'Welcome Hero Banner',
        subtitle: 'Main introductory banner',
        badge: 'Premier Academy',
        enabled: true,
        order: 0,
        layout: 'split',
        background: {
          type: 'theme_gradient',
          overlayOpacity: 10
        },
        padding: 'spacious',
        content: {
          headline: `Transform Your Potential with ${safeName}`,
          subheadline: safeTagline,
          badgeText: '🌟 2026 Accredited Enterprise Learning',
          badgeIcon: 'verified',
          primaryCtaText: 'Explore Certified Courses',
          primaryCtaAction: '#courses',
          secondaryCtaText: 'Watch Platform Tour',
          secondaryCtaAction: '#video',
          secondaryCtaActionType: 'video_modal',
          videoModalUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          showSecondaryCta: true,
          heroMedia: 'interactive_card',
          heroImageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
          showCardOverlay: true,
          cardBadgeText: 'LIVE VIRTUAL CLASSROOMS ACTIVE',
          cardBadgeColor: 'emerald',
          cardBadgePulse: true,
          cardTitle: 'Interactive Learning Platform',
          cardDescription: 'Multi-Tenant LMS with SCORM Support, Transcripts & Verifiable Badges',
          cardActionText: 'Explore Interactive Labs',
          cardActionUrl: '#courses',
          showSearchBox: true,
          searchPlaceholder: 'Search 250+ courses, skills, or certifications...',
          statChips: [
            { id: 's1', value: '45,000+', label: 'Active Learners', icon: 'groups' },
            { id: 's2', value: '98.6%', label: 'Completion Rate', icon: 'trending_up' },
            { id: 's3', value: '180+', label: 'Accredited Programs', icon: 'workspace_premium' }
          ]
        } as HeroBannerContent
      },

      // 2. Carousel Slider
      {
        id: 'highlights-slider',
        type: 'carousel_slider',
        title: 'Featured Initiatives',
        subtitle: 'Interactive highlight carousel showcasing core program pillars',
        badge: 'Featured',
        enabled: true,
        order: 1,
        layout: 'fullwidth',
        background: {
          type: 'neutral'
        },
        padding: 'standard',
        content: {
          variant: 'depth_coverflow',
          autoPlayIntervalMs: 5000,
          autoPlay: true,
          showDots: true,
          showArrows: true,
          showTimelineBar: true,
          slides: [
            {
              id: 'slide-1',
              title: 'AI & Next-Gen Cloud Architecture Specialization',
              subtitle: 'Comprehensive deep dive into multi-agent systems, LLM fine-tuning, and enterprise security frameworks.',
              imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80',
              badge: 'Featured Specialization',
              ctaText: 'View Curriculum',
              ctaAction: '#courses',
              overlayStyle: 'dark',
              category: 'Artificial Intelligence',
              dateLabel: '2026 Cohort'
            },
            {
              id: 'slide-2',
              title: 'Global Compliance & ISO 27001 Master Series',
              subtitle: 'Mandatory and elective compliance paths designed by top industry practitioners with automated certificates.',
              imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80',
              badge: 'Certification',
              ctaText: 'Explore Compliance',
              ctaAction: '#courses',
              overlayStyle: 'gradient',
              category: 'Security & Governance',
              dateLabel: 'Accredited Track'
            },
            {
              id: 'slide-3',
              title: 'Executive Leadership & Strategic Management',
              subtitle: 'Lead high-performing teams, navigate digital transformation, and foster an agile workplace culture.',
              imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80',
              badge: 'Executive',
              ctaText: 'Join Cohort',
              ctaAction: '#contact',
              overlayStyle: 'dark',
              category: 'Leadership & Strategy',
              dateLabel: 'Executive Masterclass'
            },
            {
              id: 'slide-4',
              title: 'Clinical Data Management & Bioethics Certification',
              subtitle: 'FDA 21 CFR Part 11 compliant protocols and international GCP trial auditing frameworks.',
              imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80',
              badge: 'Healthcare',
              ctaText: 'Explore Program',
              ctaAction: '#courses',
              overlayStyle: 'gradient',
              category: 'Healthcare & Regulatory',
              dateLabel: 'GCP Certified'
            }
          ]
        } as CarouselSliderContent
      },

      // 3. Video Showcase
      {
        id: 'video',
        type: 'video_showcase',
        title: 'Experience Our Learning Ecosystem',
        subtitle: 'Watch how our immersive classroom player, interactive labs, and instant digital certificates accelerate career growth.',
        badge: 'Interactive Tour',
        enabled: true,
        order: 2,
        layout: 'centered',
        background: {
          type: 'theme_light'
        },
        padding: 'spacious',
        content: {
          videoTitle: 'Inside the Learner Portal & Classroom Player',
          badgeText: 'HD Video Walkthrough (3:45)',
          description: 'A 360-degree tour of our modular curriculum architecture, live virtual classrooms, real-time quizzes, and verifiable blockchain-grade certificates.',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          posterUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
          durationText: '3 Min Video',
          bulletPoints: [
            'Bite-sized interactive microlearning lessons on any device',
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
      },

      // 4. Showcasing Products / Courses
      {
        id: 'courses',
        type: 'courses_grid',
        title: 'Featured Curriculum & Programs',
        subtitle: 'Explore our highest rated programs taught by leading industry practitioners with verifiable digital certificates upon completion.',
        badge: 'Top Programs',
        enabled: true,
        order: 3,
        layout: 'standard',
        background: {
          type: 'neutral'
        },
        padding: 'spacious',
        content: {
          sectionTagline: 'Curated by master instructional designers to guarantee job-ready competency.',
          filterCategories: ['All Categories', 'Compliance & Security', 'AI & Data', 'Healthcare', 'Engineering', 'Leadership'],
          displayCount: 6,
          columns: 3,
          showPrice: true,
          showRating: true,
          showEnrollButton: true,
          enrollButtonText: 'Enroll Now',
          enrollButtonAction: 'modal',
          showLevelBadge: true,
          showInstructor: true,
          viewAllLink: '/courses'
        } as CoursesGridContent
      },

      // 5. Instructors Card
      {
        id: 'instructors',
        type: 'instructors_directory',
        title: 'Learn from Recognized Global Experts',
        subtitle: 'Our instructors combine world-class research with decades of active executive and technical leadership.',
        badge: 'Distinguished Faculty',
        enabled: true,
        order: 4,
        layout: 'standard',
        background: {
          type: 'theme_light'
        },
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
              avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&h=300&q=80',
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
              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300&q=80',
              rating: 4.98,
              coursesCount: 12,
              studentsCount: '19,800',
              specialties: ['Generative AI', 'Agentic Workflows', 'Python']
            },
            {
              id: 'inst-3',
              name: 'Prof. Elena Rostova',
              title: 'Head of Clinical Compliance & Bioethics',
              department: 'Healthcare & Regulatory Affairs',
              bio: 'Key contributor to international GCP guidelines with 20+ clinical trials audited across US and EU jurisdictions.',
              avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&h=300&q=80',
              rating: 4.92,
              coursesCount: 6,
              studentsCount: '8,400',
              specialties: ['FDA 21 CFR', 'Clinical Trials', 'GCP']
            },
            {
              id: 'inst-4',
              name: 'Julian Vance',
              title: 'Managing Director & Executive Coach',
              department: 'Strategic Leadership & Operations',
              bio: 'Advises global NGOs and enterprise boards on operational resilience, change management, and high-velocity execution.',
              avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300&q=80',
              rating: 4.89,
              coursesCount: 5,
              studentsCount: '11,300',
              specialties: ['Executive Strategy', 'People Ops', 'Change Leadership']
            }
          ]
        } as InstructorsDirectoryContent
      },

      // 6. Testimonials
      {
        id: 'testimonials',
        type: 'testimonials',
        title: 'Trusted by Thousands of Professionals',
        subtitle: 'Read real reviews and success stories from learners and enterprise teams who transformed their careers.',
        badge: 'Social Proof',
        enabled: true,
        order: 5,
        layout: 'standard',
        background: {
          type: 'neutral'
        },
        padding: 'spacious',
        content: {
          layout: 'grid',
          testimonials: [
            {
              id: 't-1',
              name: 'Alexandra Wright',
              role: 'Lead Cloud Architect',
              organization: 'Apex Global Enterprises',
              avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
              rating: 5,
              comment: 'The structured learning phases and instant certificate verification helped our entire engineering department attain SOC-2 compliance in half the standard timeframe.',
              verified: true,
              courseTaken: 'ISO 27001 & SOC-2 Cybersecurity Governance'
            },
            {
              id: 't-2',
              name: 'David Chen',
              role: 'Senior Data Scientist',
              organization: 'FinTech Capital',
              avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
              rating: 5,
              comment: 'Hands down the best practical AI curriculum available. The interactive code labs and real-world instructor office hours made complex concepts immediately actionable.',
              verified: true,
              courseTaken: 'Modern Generative AI Architecture'
            },
            {
              id: 't-3',
              name: 'Sophia Patel',
              role: 'Director of Clinical Operations',
              organization: 'BioHealth Institute',
              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
              rating: 5,
              comment: 'The multi-tenant hierarchy and granular progress telemetry make it effortless to audit staff certifications and regulatory requirements across 5 global sites.',
              verified: true,
              courseTaken: 'Good Clinical Practice (GCP) & FDA Compliance'
            }
          ]
        } as TestimonialsContent
      },

      // 7. Partners & Accreditation
      {
        id: 'partners',
        type: 'partners_ticker',
        title: 'Accredited by Global Authorities & Industry Leaders',
        subtitle: 'Our curricula and certifications are recognized worldwide by top industry organizations and institutions.',
        badge: 'Accreditation & Partners',
        enabled: true,
        order: 6,
        layout: 'standard',
        background: {
          type: 'theme_light'
        },
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
            { id: 'p6', name: 'logoipsum', svgType: 'shield', category: 'Security' },
            { id: 'p7', name: 'logoipsum', svgType: 'spark', category: 'Innovation' },
            { id: 'p8', name: 'logoipsum', svgType: 'infinity', category: 'Continuous Learning' }
          ]
        } as PartnersTickerContent
      },

      // 8. Latest News
      {
        id: 'news',
        type: 'latest_news',
        title: 'Latest News & Insights',
        subtitle: 'Stay updated with executive summaries, research papers, and platform announcements.',
        badge: 'Insights',
        enabled: true,
        order: 7,
        layout: 'standard',
        background: {
          type: 'neutral'
        },
        padding: 'spacious',
        content: {
          displayCount: 3,
          enableSubscribeNewsletter: true,
          items: [
            {
              id: 'news-1',
              title: '2026 Global Workforce Learning Trends Report Released',
              excerpt: 'Discover how AI-assisted skill cluster mapping and micro-credentials are revolutionizing enterprise talent mobility and retention.',
              category: 'Research Report',
              date: 'September 15, 2026',
              author: 'Dr. Sarah Sterling',
              authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&h=100&q=80',
              imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
              readTime: '5 min read',
              tag: 'Industry'
            },
            {
              id: 'news-2',
              title: 'Announcing 12 New Specialized Security & SOC-2 Learning Pathways',
              excerpt: 'Hands-on interactive lab exercises now integrated into every module with instant automated grading and vulnerability sandbox reviews.',
              category: 'Platform Update',
              date: 'September 08, 2026',
              author: 'Marcus Thorne',
              authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
              imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
              readTime: '4 min read',
              tag: 'Security'
            },
            {
              id: 'news-3',
              title: 'How Multi-Tenant LMS Architecture Streamlines Global Audits',
              excerpt: 'A deep dive into tenant isolation, custom branding parameters, and automated compliance escalation workflows.',
              category: 'Case Study',
              date: 'August 28, 2026',
              author: 'Julian Vance',
              authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80',
              imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=600&q=80',
              readTime: '6 min read',
              tag: 'Architecture'
            }
          ]
        } as LatestNewsContent
      },

      // 9. About Us / Mission & Highlights
      {
        id: 'about',
        type: 'about_us',
        title: `About ${safeName}`,
        subtitle: 'Our story, mission, and dedication to accessible, high-impact enterprise education.',
        badge: 'Our Mission',
        enabled: true,
        order: 8,
        layout: 'split',
        background: {
          type: 'theme_light'
        },
        padding: 'spacious',
        content: {
          missionTitle: 'Bridging the Global Competency Gap with Next-Generation Learning Infrastructure',
          missionText: `${safeName} was established to eliminate fragmented learning silos and provide an institutional-grade, multi-tenant portal that empowers individuals and organizations to continuously upskill, certify, and thrive in rapidly changing industries.`,
          visionText: 'We envision a future where high-quality technical, clinical, and leadership education is seamlessly accessible, verifiable through open credentials, and measurable in real-time business outcomes.',
          pillars: [
            { icon: 'military_tech', title: 'Rigorous Academic Quality', description: 'Every curriculum module undergoes dual peer review by domain practitioners and instructional architects.' },
            { icon: 'security', title: 'Enterprise Governance', description: 'Built-in multi-role access controls, SSO integration, and SOC-2 / ISO 27001 compliant data residency.' },
            { icon: 'speed', title: 'High Velocity Execution', description: 'Zero friction onboarding with interactive lab environments and automated certificate distribution.' }
          ],
          achievementStats: [
            { value: '14+', label: 'Years of Excellence', icon: 'history_edu' },
            { value: '99.4%', label: 'Learner Satisfaction', icon: 'sentiment_very_satisfied' },
            { value: '250+', label: 'Certified Courses', icon: 'menu_book' }
          ],
          image1Url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
          image2Url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80'
        } as AboutUsContent
      },

      // 10. Contact & Inquiries
      {
        id: 'contact',
        type: 'contact_form',
        title: 'Get in Touch with Our Academic Advisors',
        subtitle: 'Have questions about enterprise cohort enrollments, custom curriculum authoring, or LMS integration? We are here to help.',
        badge: 'Direct Connect',
        enabled: true,
        order: 9,
        layout: 'split',
        background: {
          type: 'neutral'
        },
        padding: 'spacious',
        content: {
          heading: 'We’d Love to Hear From You',
          description: 'Fill out the form and our advisory team will respond within 24 business hours with customized program recommendations.',
          email: 'admissions@enterprise-lms.net',
          phone: '+1 (800) 555-0199 / +880 2 2222 81265',
          address: '75 Mohakhali, Dhaka 1212 / Global Innovation Hub, Silicon Valley, CA',
          workingHours: 'Monday – Friday: 08:00 AM – 07:00 PM (UTC)',
          subjectOptions: [
            'General Inquiries & Admissions',
            'Enterprise Team License & Multi-Tenant Setup',
            'Custom Course Authoring & SCORM Import',
            'Technical Support & SSO Integration'
          ],
          enableMapOrGraphic: true,
          successMessage: 'Thank you for reaching out! Your inquiry has been dispatched to our academic advisory team.'
        } as ContactFormContent
      },

      // 11. FAQ Accordion
      {
        id: 'faq',
        type: 'faq_accordion',
        title: 'Frequently Asked Questions',
        subtitle: 'Everything you need to know about accessing courses, earning certificates, and enterprise team plans.',
        badge: 'Knowledge Base',
        enabled: true,
        order: 10,
        layout: 'centered',
        background: {
          type: 'theme_light'
        },
        padding: 'spacious',
        content: {
          faqs: [
            {
              id: 'faq-1',
              question: 'How do I access my enrolled courses and classroom materials?',
              answer: 'Once you sign in to the portal via SSO or email credentials, all active courses are immediately accessible in your Learner Dashboard. You can resume video playback, interactive lab assignments, and review downloadable transcripts at any time.'
            },
            {
              id: 'faq-2',
              question: 'Are the digital certificates verifiable and compliant with industry standards?',
              answer: 'Yes. Every issued certificate includes a unique cryptographic verification hash, authorized digital signatories, and full OpenBadges 2.0 metadata that can be shared on LinkedIn, added to resumes, or verified in our public certificate vault.'
            },
            {
              id: 'faq-3',
              question: 'Can organizations provision custom branded portals and private course catalogs?',
              answer: 'Absolutely. Our multi-tenant LMS architecture allows each organization or department to customize their landing pages, brand colors, SSO login screens, role permissions, and private curriculum repositories with zero coding required.'
            },
            {
              id: 'faq-4',
              question: 'What happens if I need help or technical support during my studies?',
              answer: 'Learners have 24/7 access to our integrated Helpdesk, peer discussion forums, and weekly live instructor office hours. Technical issues can also be submitted directly through our contact portal.'
            }
          ]
        } as FaqAccordionContent
      },

      // 12. CTA Banner
      {
        id: 'cta-footer',
        type: 'cta_banner',
        title: 'Ready to Accelerate Your Career?',
        subtitle: 'Join over 45,000 active learners and start earning recognized credentials today.',
        badge: 'Start Today',
        enabled: true,
        order: 11,
        layout: 'centered',
        background: {
          type: 'theme_gradient'
        },
        padding: 'spacious',
        content: {
          title: 'Start Learning Today and Unlock Certified Excellence',
          subtitle: 'Create your account or log in via your organization SSO to access comprehensive course modules.',
          ctaText: 'Access Learner Portal',
          ctaAction: '/login',
          badgeText: 'Instant Digital Access',
          backgroundStyle: 'gradient'
        } as CtaBannerContent
      }
    ],
    footer: {
      brandSummary: `${safeName} provides scalable, accredited enterprise learning pathways, interactive classroom players, and verifiable digital credentials for global organizations.`,
      copyrightText: `© ${new Date().getFullYear()} ${safeName}. All Rights Reserved.`,
      showSocialLinks: true,
      socialLinks: [
        { platform: 'linkedin', url: 'https://linkedin.com' },
        { platform: 'twitter', url: 'https://twitter.com' },
        { platform: 'youtube', url: 'https://youtube.com' },
        { platform: 'github', url: 'https://github.com' }
      ],
      columns: [
        {
          title: 'Curriculum & Programs',
          links: [
            { label: 'All Courses', url: '#courses' },
            { label: 'Cybersecurity & SOC-2', url: '#courses' },
            { label: 'Generative AI Architecture', url: '#courses' },
            { label: 'Clinical Compliance & GCP', url: '#courses' },
            { label: 'Executive Leadership', url: '#courses' }
          ]
        },
        {
          title: 'Platform Navigation',
          links: [
            { label: 'Interactive Tour', url: '#video' },
            { label: 'Distinguished Faculty', url: '#instructors' },
            { label: 'Success Stories', url: '#testimonials' },
            { label: 'Latest Insights', url: '#news' },
            { label: 'About Our Mission', url: '#about' }
          ]
        },
        {
          title: 'Support & Resources',
          links: [
            { label: 'Frequently Asked Questions', url: '#faq' },
            { label: 'Contact Academic Advisors', url: '#contact' },
            { label: 'Certificates Vault', url: '/certificates/vault' },
            { label: 'Sign In to Portal', url: '/login' }
          ]
        }
      ],
      showNewsletter: true,
      newsletterHeadline: 'Subscribe to Executive Briefings',
      newsletterSubtext: 'Receive monthly curriculum updates, research insights, and compliance alerts directly in your inbox.',
      showLegalLinks: true,
      privacyUrl: '#privacy',
      termsUrl: '#terms',
      cookiesUrl: '#cookies',
      privacyLabel: 'Privacy Policy',
      termsLabel: 'Terms of Service',
      cookiesLabel: 'Cookie Preferences'
    }
  };
}
