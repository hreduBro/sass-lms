import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusIllustrationType = '404' | 'maintenance' | '401' | '500' | '403';

@Component({
  selector: 'app-status-illustration',
  imports: [CommonModule],
  template: `
    <div class="relative w-full max-w-[340px] sm:max-w-[400px] aspect-[4/3] mx-auto flex items-center justify-center select-none" [attr.aria-label]="type()">
      
      @switch (type()) {
        
        <!-- ============================================================= -->
        <!-- 404: Document + Magnifying Glass (Matches Top-Left Image)     -->
        <!-- ============================================================= -->
        @case ('404') {
          <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-sm">
            <defs>
              <!-- Soft cloud / base glow -->
              <radialGradient id="glow404" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="var(--tenant-primary, #3b82f6)" stop-opacity="0.12" />
                <stop offset="100%" stop-color="var(--tenant-primary, #3b82f6)" stop-opacity="0" />
              </radialGradient>
              <linearGradient id="lensShine" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8" />
                <stop offset="40%" stop-color="#ffffff" stop-opacity="0.1" />
                <stop offset="100%" stop-color="var(--tenant-primary, #3b82f6)" stop-opacity="0.15" />
              </linearGradient>
              <filter id="cardShadow404" x="-10%" y="-10%" width="125%" height="130%">
                <feDropShadow dx="0" dy="8" stdDeviation="10" flood-opacity="0.06" />
              </filter>
            </defs>

            <!-- Background Ambient Glow / Cloud -->
            <ellipse cx="200" cy="160" rx="140" ry="85" fill="url(#glow404)" />
            <ellipse cx="200" cy="242" rx="110" ry="16" fill="var(--tenant-primary, #3b82f6)" fill-opacity="0.07" />

            <!-- Underlaying document page (tilted slightly) -->
            <rect x="100" y="55" width="130" height="170" rx="10" 
                  fill="var(--base-300, #e2e8f0)" 
                  transform="rotate(-5 100 55)" />

            <!-- Main White Document Card -->
            <g filter="url(#cardShadow404)">
              <rect x="110" y="60" width="145" height="180" rx="12" 
                    fill="var(--base-100, #ffffff)" 
                    stroke="var(--base-300, #e2e8f0)" 
                    stroke-width="1.5" />
              
              <!-- Document Header Rule -->
              <rect x="135" y="76" width="60" height="5" rx="2.5" fill="var(--tenant-primary, #3b82f6)" fill-opacity="0.6" />

              <!-- Bullet Points (4 left circles) -->
              <circle cx="132" cy="104" r="4.5" fill="none" stroke="var(--tenant-primary, #3b82f6)" stroke-width="2" stroke-opacity="0.75" />
              <circle cx="132" cy="128" r="4.5" fill="none" stroke="var(--tenant-primary, #3b82f6)" stroke-width="2" stroke-opacity="0.75" />
              <circle cx="132" cy="152" r="4.5" fill="none" stroke="var(--tenant-primary, #3b82f6)" stroke-width="2" stroke-opacity="0.75" />
              <circle cx="132" cy="176" r="4.5" fill="none" stroke="var(--tenant-primary, #3b82f6)" stroke-width="2" stroke-opacity="0.75" />

              <!-- Horizontal Text Lines -->
              <rect x="146" y="102" width="75" height="4.5" rx="2.25" fill="var(--base-300, #e2e8f0)" />
              <rect x="146" y="126" width="85" height="4.5" rx="2.25" fill="var(--base-300, #e2e8f0)" />
              <rect x="146" y="150" width="65" height="4.5" rx="2.25" fill="var(--base-300, #e2e8f0)" />
              <rect x="146" y="174" width="80" height="4.5" rx="2.25" fill="var(--base-300, #e2e8f0)" />
            </g>

            <!-- Magnifying Glass Over Document -->
            <g class="transition-transform duration-300 hover:scale-105" style="transform-origin: 245px 145px;">
              <!-- Glass Lens Rim Shadow -->
              <circle cx="230" cy="135" r="38" fill="url(#lensShine)" />
              
              <!-- Bold Dark Outer Rim -->
              <circle cx="230" cy="135" r="38" 
                      fill="none" 
                      stroke="#0f172a" 
                      stroke-width="7" />

              <!-- Lens Glass Reflection Arc -->
              <path d="M 210 115 A 28 28 0 0 1 248 115" 
                    fill="none" 
                    stroke="#ffffff" 
                    stroke-width="3" 
                    stroke-linecap="round" />

              <!-- Magnifying Glass Handle -->
              <!-- Metal Stem connecting to rim -->
              <path d="M 257 162 L 292 197" 
                    stroke="#0f172a" 
                    stroke-width="10" 
                    stroke-linecap="round" />
              <!-- Accent grip on handle tip in theme color -->
              <path d="M 278 183 L 292 197" 
                    stroke="var(--tenant-primary, #3b82f6)" 
                    stroke-width="8" 
                    stroke-linecap="round" />
            </g>
          </svg>
        }

        <!-- ========================================================================= -->
        <!-- Maintenance: Barrier, Cone & Signpost (Matches Top-Right Image)           -->
        <!-- ========================================================================= -->
        @case ('maintenance') {
          <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-sm">
            <defs>
              <radialGradient id="glowMaint" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="var(--tenant-primary, #3b82f6)" stop-opacity="0.12" />
                <stop offset="100%" stop-color="var(--tenant-primary, #3b82f6)" stop-opacity="0" />
              </radialGradient>
              <filter id="shadowMaint" x="-10%" y="-10%" width="125%" height="130%">
                <feDropShadow dx="0" dy="6" stdDeviation="8" flood-opacity="0.05" />
              </filter>
            </defs>

            <!-- Background Ambient Glow & Ground Shadow -->
            <ellipse cx="200" cy="160" rx="140" ry="85" fill="url(#glowMaint)" />
            <ellipse cx="200" cy="245" rx="125" ry="14" fill="var(--tenant-primary, #3b82f6)" fill-opacity="0.07" />

            <!-- Left: Traffic Safety Cone -->
            <g class="transition-transform duration-300 hover:-translate-y-1">
              <!-- Cone Base -->
              <rect x="130" y="196" width="38" height="5" rx="2.5" fill="var(--base-300, #cbd5e1)" />
              <!-- Cone Body -->
              <path d="M 134 196 L 146 150 L 152 150 L 164 196 Z" fill="var(--tenant-primary, #3b82f6)" fill-opacity="0.18" />
              <!-- Cone White Stripes -->
              <path d="M 139 178 L 144 163 L 154 163 L 159 178 Z" fill="#ffffff" />
              <!-- Cone Top Accent -->
              <path d="M 146 150 L 147 146 L 151 146 L 152 150 Z" fill="var(--tenant-primary, #3b82f6)" />
            </g>

            <!-- Center: Construction Barrier with Chevrons -->
            <g filter="url(#shadowMaint)">
              <!-- Vertical Legs -->
              <rect x="175" y="160" width="8" height="75" rx="3" fill="var(--base-300, #94a3b8)" />
              <rect x="255" y="160" width="8" height="75" rx="3" fill="var(--base-300, #94a3b8)" />
              <!-- Floor Feet / Stands -->
              <rect x="169" y="230" width="20" height="6" rx="3" fill="var(--text-secondary, #64748b)" />
              <rect x="249" y="230" width="20" height="6" rx="3" fill="var(--text-secondary, #64748b)" />

              <!-- Main Horizontal Barrier Board -->
              <rect x="140" y="162" width="160" height="34" rx="6" 
                    fill="var(--base-100, #ffffff)" 
                    stroke="var(--base-300, #cbd5e1)" 
                    stroke-width="1.5" />
              
              <!-- Chevron Stripes (<<<) across the barrier board -->
              <path d="M 160 165 L 150 179 L 160 193 L 168 193 L 158 179 L 168 165 Z" fill="var(--tenant-primary, #3b82f6)" fill-opacity="0.25" />
              <path d="M 190 165 L 180 179 L 190 193 L 198 193 L 188 179 L 198 165 Z" fill="var(--tenant-primary, #3b82f6)" fill-opacity="0.25" />
              <path d="M 220 165 L 210 179 L 220 193 L 228 193 L 218 179 L 228 165 Z" fill="var(--tenant-primary, #3b82f6)" fill-opacity="0.25" />
              <path d="M 250 165 L 240 179 L 250 193 L 258 193 L 248 179 L 258 165 Z" fill="var(--tenant-primary, #3b82f6)" fill-opacity="0.25" />
              <path d="M 280 165 L 270 179 L 280 193 L 288 193 L 278 179 L 288 165 Z" fill="var(--tenant-primary, #3b82f6)" fill-opacity="0.25" />
            </g>

            <!-- Right: Warning Signpost with Exclamation Diamond -->
            <g class="transition-transform duration-300 hover:-translate-y-1">
              <!-- Metal Post -->
              <rect x="258" y="125" width="4" height="40" rx="2" fill="#0f172a" />
              
              <!-- Diamond Warning Sign -->
              <g transform="translate(260, 110) rotate(45)">
                <rect x="-18" y="-18" width="36" height="36" rx="6" 
                      fill="var(--base-100, #ffffff)" 
                      stroke="var(--base-300, #cbd5e1)" 
                      stroke-width="2" />
                <rect x="-14" y="-14" width="28" height="28" rx="4" 
                      fill="none" 
                      stroke="var(--tenant-primary, #3b82f6)" 
                      stroke-opacity="0.3" 
                      stroke-width="1.5" />
              </g>

              <!-- Exclamation Mark Inside Sign -->
              <rect x="258.5" y="100" width="3" height="12" rx="1.5" fill="#0f172a" />
              <circle cx="260" cy="118" r="2" fill="#0f172a" />
            </g>
          </svg>
        }

        <!-- ========================================================================= -->
        <!-- 401: Document + Padlock + Security Shield (Matches Bottom-Left Image)     -->
        <!-- ========================================================================= -->
        @case ('401') {
          <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-sm">
            <defs>
              <radialGradient id="glow401" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="var(--tenant-primary, #3b82f6)" stop-opacity="0.12" />
                <stop offset="100%" stop-color="var(--tenant-primary, #3b82f6)" stop-opacity="0" />
              </radialGradient>
              <filter id="cardShadow401" x="-10%" y="-10%" width="125%" height="130%">
                <feDropShadow dx="0" dy="8" stdDeviation="10" flood-opacity="0.06" />
              </filter>
            </defs>

            <!-- Background Glow & Ground Shadow -->
            <ellipse cx="200" cy="160" rx="140" ry="85" fill="url(#glow401)" />
            <ellipse cx="200" cy="242" rx="115" ry="16" fill="var(--tenant-primary, #3b82f6)" fill-opacity="0.07" />

            <!-- Underlaying subtle document fold -->
            <rect x="135" y="58" width="130" height="165" rx="10" 
                  fill="var(--base-300, #e2e8f0)" 
                  transform="rotate(3 135 58)" />

            <!-- Main Document Sheet -->
            <g filter="url(#cardShadow401)">
              <rect x="125" y="60" width="145" height="175" rx="12" 
                    fill="var(--base-100, #ffffff)" 
                    stroke="var(--base-300, #e2e8f0)" 
                    stroke-width="1.5" />
              
              <!-- Document Header Bar -->
              <rect x="145" y="78" width="55" height="5" rx="2.5" fill="var(--tenant-primary, #3b82f6)" fill-opacity="0.6" />

              <!-- Document Body Lines -->
              <rect x="145" y="98" width="90" height="4.5" rx="2.25" fill="var(--base-300, #e2e8f0)" />
              <rect x="145" y="114" width="105" height="4.5" rx="2.25" fill="var(--base-300, #e2e8f0)" />
              <rect x="145" y="130" width="80" height="4.5" rx="2.25" fill="var(--base-300, #e2e8f0)" />
              <rect x="145" y="146" width="100" height="4.5" rx="2.25" fill="var(--base-300, #e2e8f0)" />
              <rect x="145" y="162" width="70" height="4.5" rx="2.25" fill="var(--base-300, #e2e8f0)" />
              <rect x="145" y="178" width="95" height="4.5" rx="2.25" fill="var(--base-300, #e2e8f0)" />
            </g>

            <!-- Top Right: Padlock Component -->
            <g class="transition-transform duration-300 hover:scale-110" style="transform-origin: 255px 95px;">
              <!-- Lock Shackle (Top Arch) -->
              <path d="M 244 88 C 244 76 266 76 266 88 L 266 94 L 244 94 Z" 
                    fill="none" 
                    stroke="var(--base-300, #94a3b8)" 
                    stroke-width="4.5" 
                    stroke-linecap="round" />
              <!-- Lock Body -->
              <rect x="235" y="92" width="40" height="32" rx="8" 
                    fill="var(--base-100, #ffffff)" 
                    stroke="var(--base-300, #cbd5e1)" 
                    stroke-width="2" />
              <!-- Keyhole Accent -->
              <circle cx="255" cy="105" r="3.5" fill="var(--tenant-primary, #3b82f6)" />
              <path d="M 253.5 105 L 256.5 105 L 258 116 L 252 116 Z" fill="var(--tenant-primary, #3b82f6)" />
            </g>

            <!-- Bottom Left: Security Shield with Lightning Bolt -->
            <g class="transition-transform duration-300 hover:scale-110" style="transform-origin: 145px 205px;">
              <!-- Shield Body -->
              <path d="M 125 185 L 165 185 C 165 215 145 235 145 235 C 145 235 125 215 125 185 Z" 
                    fill="var(--base-100, #ffffff)" 
                    stroke="var(--base-300, #cbd5e1)" 
                    stroke-width="2" />
              
              <!-- Subtle Shield Inset Border -->
              <path d="M 130 190 L 160 190 C 160 212 145 228 145 228 C 145 228 130 212 130 190 Z" 
                    fill="var(--tenant-primary, #3b82f6)" 
                    fill-opacity="0.08" />

              <!-- Lightning Bolt inside Shield in Theme Color -->
              <path d="M 147 194 L 139 207 L 145 207 L 143 218 L 151 204 L 146 204 Z" 
                    fill="var(--tenant-primary, #3b82f6)" />
            </g>
          </svg>
        }

        <!-- ========================================================================= -->
        <!-- 500: Server Farm / Data Center Towers (Matches Bottom-Right Image)        -->
        <!-- ========================================================================= -->
        @case ('500') {
          <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-sm">
            <defs>
              <radialGradient id="glow500" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="var(--tenant-primary, #3b82f6)" stop-opacity="0.12" />
                <stop offset="100%" stop-color="var(--tenant-primary, #3b82f6)" stop-opacity="0" />
              </radialGradient>
              <filter id="serverShadow" x="-10%" y="-10%" width="125%" height="130%">
                <feDropShadow dx="0" dy="8" stdDeviation="10" flood-opacity="0.06" />
              </filter>
            </defs>

            <!-- Background Ambient Cloud Bulb Shapes -->
            <ellipse cx="200" cy="150" rx="130" ry="80" fill="url(#glow500)" />
            <path d="M 120 180 C 110 130 180 100 210 120 C 240 90 300 120 290 170 C 310 200 270 230 200 230 C 140 230 110 210 120 180 Z" 
                  fill="var(--tenant-primary, #3b82f6)" 
                  fill-opacity="0.04" />
            <ellipse cx="200" cy="245" rx="120" ry="14" fill="var(--tenant-primary, #3b82f6)" fill-opacity="0.07" />

            <!-- 3 Server Racks (Left, Center, Right) -->
            <g filter="url(#serverShadow)">
              
              <!-- Tower 1: Left Server Rack (Slightly shorter) -->
              <g class="transition-transform duration-300 hover:-translate-y-1">
                <rect x="125" y="125" width="44" height="110" rx="4" 
                      fill="var(--base-100, #ffffff)" 
                      stroke="var(--base-300, #cbd5e1)" 
                      stroke-width="1.5" />
                <!-- 6 Server Blades -->
                @for (i of [0, 1, 2, 3, 4, 5]; track i) {
                  <rect [attr.x]="129" [attr.y]="130 + i * 17" width="36" height="13" rx="2" fill="var(--base-200, #f8fafc)" stroke="var(--base-300, #e2e8f0)" stroke-width="1" />
                  <!-- Blade Vent Lines -->
                  <rect [attr.x]="132" [attr.y]="135 + i * 17" width="16" height="2" rx="1" fill="var(--base-300, #cbd5e1)" />
                  <!-- Blade LED Light in Theme Color -->
                  <circle [attr.cx]="159" [attr.cy]="136 + i * 17" r="1.75" fill="var(--tenant-primary, #3b82f6)" />
                }
              </g>

              <!-- Tower 2: Middle Server Rack (Tallest, Centered) -->
              <g class="transition-transform duration-300 hover:-translate-y-1">
                <rect x="178" y="100" width="46" height="135" rx="4" 
                      fill="var(--base-100, #ffffff)" 
                      stroke="var(--base-300, #cbd5e1)" 
                      stroke-width="1.5" />
                <!-- 7 Server Blades -->
                @for (i of [0, 1, 2, 3, 4, 5, 6]; track i) {
                  <rect [attr.x]="182" [attr.y]="105 + i * 18" width="38" height="14" rx="2" fill="var(--base-200, #f8fafc)" stroke="var(--base-300, #e2e8f0)" stroke-width="1" />
                  <!-- Blade Vent Lines -->
                  <rect [attr.x]="186" [attr.y]="110 + i * 18" width="18" height="2" rx="1" fill="var(--base-300, #cbd5e1)" />
                  <!-- Blade LED Light in Theme Color -->
                  <circle [attr.cx]="214" [attr.cy]="111 + i * 18" r="1.75" fill="var(--tenant-primary, #3b82f6)" />
                }
              </g>

              <!-- Tower 3: Right Server Rack -->
              <g class="transition-transform duration-300 hover:-translate-y-1">
                <rect x="233" y="110" width="44" height="125" rx="4" 
                      fill="var(--base-100, #ffffff)" 
                      stroke="var(--base-300, #cbd5e1)" 
                      stroke-width="1.5" />
                <!-- 6 Server Blades -->
                @for (i of [0, 1, 2, 3, 4, 5, 6]; track i) {
                  <rect [attr.x]="237" [attr.y]="115 + i * 16" width="36" height="12" rx="2" fill="var(--base-200, #f8fafc)" stroke="var(--base-300, #e2e8f0)" stroke-width="1" />
                  <!-- Blade Vent Lines -->
                  <rect [attr.x]="240" [attr.y]="120 + i * 16" width="16" height="2" rx="1" fill="var(--base-300, #cbd5e1)" />
                  <!-- Blade LED Light in Theme Color -->
                  <circle [attr.cx]="267" [attr.cy]="121 + i * 16" r="1.75" fill="var(--tenant-primary, #3b82f6)" />
                }
              </g>

            </g>
          </svg>
        }

        <!-- ========================================================================= -->
        <!-- 403: Security Clearance / Blocked Shield Variant                         -->
        <!-- ========================================================================= -->
        @case ('403') {
          <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-sm">
            <defs>
              <radialGradient id="glow403" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="var(--tenant-primary, #3b82f6)" stop-opacity="0.12" />
                <stop offset="100%" stop-color="var(--tenant-primary, #3b82f6)" stop-opacity="0" />
              </radialGradient>
            </defs>
            <ellipse cx="200" cy="160" rx="140" ry="85" fill="url(#glow403)" />
            <ellipse cx="200" cy="242" rx="115" ry="16" fill="var(--tenant-primary, #3b82f6)" fill-opacity="0.07" />
            
            <!-- Large Crest Shield -->
            <g class="transition-transform duration-300 hover:scale-105" style="transform-origin: 200px 150px;">
              <path d="M 160 90 L 240 90 C 240 160 200 205 200 205 C 200 205 160 160 160 90 Z" 
                    fill="var(--base-100, #ffffff)" 
                    stroke="var(--base-300, #cbd5e1)" 
                    stroke-width="2.5" />
              
              <path d="M 168 98 L 232 98 C 232 154 200 193 200 193 C 200 193 168 154 168 98 Z" 
                    fill="var(--tenant-primary, #3b82f6)" 
                    fill-opacity="0.08" />

              <!-- Security Keyhole & Slash in Theme Color -->
              <circle cx="200" cy="132" r="9" fill="var(--tenant-primary, #3b82f6)" />
              <path d="M 197 132 L 203 132 L 206 155 L 194 155 Z" fill="var(--tenant-primary, #3b82f6)" />
              
              <!-- Block slash -->
              <line x1="175" y1="170" x2="225" y2="110" stroke="var(--tenant-primary, #3b82f6)" stroke-width="4" stroke-linecap="round" />
            </g>
          </svg>
        }

      }

    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusIllustrationComponent {
  type = input.required<StatusIllustrationType>();
}
