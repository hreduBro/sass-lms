import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseEntity, CourseStructureNode, CourseContentItem, summarizeCourseMetrics } from '../../../models/course.model';

@Component({
  selector: 'app-course-structure-drawer',
  imports: [CommonModule],
  template: `
    @if (course(); as crs) {
      @let metrics = getMetrics(crs);

      <div class="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
        <div class="w-full max-w-2xl bg-base-100 rounded-3xl shadow-2xl border border-base-300 flex flex-col overflow-hidden animate-scale-up max-h-[90vh]">
          
          <!-- Modal Header (Matching Exact Version Management Modal Style) -->
          <div class="p-6 border-b border-base-300 bg-base-200/50 flex items-center justify-between">
            <div class="flex items-center gap-3.5">
              <div class="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center border border-indigo-500/20">
                <span class="material-symbols-outlined text-2xl">account_tree</span>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 font-mono">
                    {{ crs.code }}
                  </span>
                  <span class="text-xs font-semibold text-text-secondary">Structure & Hierarchy</span>
                </div>
                <h2 class="text-base font-bold text-text-primary mt-0.5 truncate">{{ crs.title }}</h2>
              </div>
            </div>
            <button 
              type="button"
              (click)="close.emit()" 
              class="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-base-300 transition-colors cursor-pointer"
              title="Close Modal">
              <span class="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <!-- Current Structure Highlights Card (Matching Version Modal Top Card) -->
          <div class="p-6 border-b border-base-300 bg-base-100">
            <div class="p-4 rounded-2xl bg-base-200/60 border border-base-300 space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="px-2.5 py-1 rounded-lg bg-tenant-500 text-white font-bold text-xs font-mono">
                    {{ crs.structureConfig.layerCount }}-Tier
                  </span>
                  <div>
                    <span class="text-xs font-bold text-text-primary">
                      {{ crs.structureConfig.layerLabels.join(' → ') }}
                    </span>
                    <p class="text-[11px] text-text-secondary">
                      {{ metrics.totalNodes }} node(s) &bull; {{ metrics.learningCount }} learning &bull; {{ metrics.assessmentCount }} assessments &bull; {{ crs.durationMinutes }}m duration
                    </p>
                  </div>
                </div>

                <div class="text-right">
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 border border-amber-500/20">
                    {{ crs.usedInPhasesCount || 0 }} Phases Locked
                  </span>
                </div>
              </div>

              <!-- Explanation Notice Card (Matching Independent Snapshot Box Style) -->
              <div class="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-text-secondary flex items-start gap-2.5">
                <span class="material-symbols-outlined text-indigo-500 text-base mt-0.5">verified_user</span>
                <div>
                  <strong class="text-indigo-600 block mb-0.5">Hierarchical Curriculum Architecture</strong>
                  Structured across {{ crs.structureConfig.layerCount }} tier(s) ({{ crs.structureConfig.layerLabels.join(' → ') }}). Preserves sequential progression, content prerequisite gating, and grading integrity.
                </div>
              </div>
            </div>
          </div>

          <!-- Curriculum Nodes Section Header & Tree Body -->
          <div class="flex-1 overflow-y-auto p-6 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold text-text-primary uppercase tracking-wider">Curriculum Nodes & Content</h3>
              <div class="flex items-center gap-3">
                <span class="text-xs text-text-secondary font-mono">{{ metrics.totalNodes }} sections</span>
                <button 
                  type="button"
                  (click)="toggleExpandAll()"
                  class="text-xs text-tenant-600 hover:text-tenant-700 font-semibold flex items-center gap-1 cursor-pointer">
                  <span class="material-symbols-outlined text-sm">{{ allExpanded() ? 'unfold_less' : 'unfold_more' }}</span>
                  <span>{{ allExpanded() ? 'Collapse All' : 'Expand All' }}</span>
                </button>
              </div>
            </div>

            <div class="space-y-3">
              @if (crs.structure && crs.structure.length > 0) {
                @for (node1 of crs.structure; track node1.nodeId; let idx1 = $index) {
                  <!-- Layer 1 Node Card -->
                  <div class="rounded-2xl border border-base-300 bg-base-100 overflow-hidden shadow-xs">
                    <div 
                      (click)="toggleNode(node1.nodeId)"
                      class="p-3.5 bg-base-200/60 hover:bg-base-200 cursor-pointer flex items-center justify-between gap-3 select-none transition-colors">
                      <div class="flex items-center gap-2.5">
                        <span class="material-symbols-outlined text-text-secondary text-base transition-transform" [class.rotate-90]="isExpanded(node1.nodeId)">
                          chevron_right
                        </span>
                        <div class="w-6 h-6 rounded-lg bg-tenant-500 text-white font-bold text-xs flex items-center justify-center font-mono">
                          {{ idx1 + 1 }}
                        </div>
                        <div>
                          <div class="flex items-center gap-2">
                            <span class="text-[10px] font-bold text-tenant-600 uppercase tracking-wide">
                              {{ crs.structureConfig.layerLabels[0] || 'Tier 1' }}
                            </span>
                            @if (node1.instructorTags && node1.instructorTags.length > 0) {
                              <span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs">school</span>
                                {{ node1.instructorTags[0].name }}
                              </span>
                            }
                          </div>
                          <h3 class="text-xs font-bold text-text-primary mt-0.5">{{ node1.title }}</h3>
                        </div>
                      </div>

                      <span class="text-[11px] text-text-secondary font-mono">
                        {{ getChildCountText(node1, crs.structureConfig.layerCount) }}
                      </span>
                    </div>

                    @if (isExpanded(node1.nodeId)) {
                      <div class="p-3 space-y-3 bg-base-100 border-t border-base-300">
                        @if (crs.structureConfig.layerCount === 1) {
                          <!-- Direct leaf content under Layer 1 -->
                          <div class="pl-3 border-l-2 border-tenant-500/20 space-y-2">
                            @for (item of node1.content || []; track item.contentId) {
                              <div class="p-3 rounded-xl bg-base-200/50 border border-base-300/80 flex items-start justify-between gap-3 text-xs">
                                <div class="flex items-start gap-2.5">
                                  <span class="material-symbols-outlined text-base mt-0.5" [class]="item.family === 'learning' ? 'text-emerald-500' : 'text-indigo-500'">
                                    {{ getContentIcon(item) }}
                                  </span>
                                  <div>
                                    <div class="flex items-center gap-1.5 mb-1">
                                      <span class="text-[10px] font-bold px-1.5 py-0.2 rounded" [class]="item.family === 'learning' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-indigo-500/10 text-indigo-600'">
                                        {{ item.family | uppercase }}
                                      </span>
                                      @if (item.assessment?.gradingMode) {
                                        <span class="text-[10px] font-semibold px-1.5 py-0.2 rounded" [class]="item.assessment?.gradingMode === 'manual' ? 'bg-amber-500/15 text-amber-700' : 'bg-slate-500/10 text-slate-600'">
                                          {{ item.assessment?.gradingMode === 'manual' ? 'Manual Grading' : 'Auto-Graded' }}
                                        </span>
                                      }
                                    </div>
                                    <h4 class="font-semibold text-text-primary text-xs">{{ item.title }}</h4>
                                    @if (item.authors && item.authors.length > 0) {
                                      <div class="flex items-center gap-1.5 mt-1.5 text-[11px] text-text-secondary">
                                        <span class="material-symbols-outlined text-xs">edit_note</span>
                                        <span>Authors:</span>
                                        @for (auth of item.authors; track auth.personId) {
                                          <span class="font-medium text-text-primary">{{ auth.name }} ({{ auth.kind }})</span>
                                        }
                                      </div>
                                    }
                                  </div>
                                </div>
                              </div>
                            } @empty {
                              <p class="text-xs text-text-secondary italic">No content items attached.</p>
                            }
                          </div>
                        } @else {
                          <!-- Layer 2 Child Nodes -->
                          <div class="pl-3 border-l-2 border-tenant-500/20 space-y-3">
                            @for (node2 of node1.children || []; track node2.nodeId; let idx2 = $index) {
                              <div class="rounded-xl border border-base-300 bg-base-200/30 overflow-hidden">
                                <div 
                                  (click)="toggleNode(node2.nodeId)"
                                  class="p-2.5 bg-base-200/80 hover:bg-base-200 cursor-pointer flex items-center justify-between select-none">
                                  <div class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-text-secondary text-sm" [class.rotate-90]="isExpanded(node2.nodeId)">
                                      chevron_right
                                    </span>
                                    <div class="w-5 h-5 rounded-md bg-tenant-500/20 text-tenant-600 font-bold text-[10px] flex items-center justify-center font-mono">
                                      {{ idx1 + 1 }}.{{ idx2 + 1 }}
                                    </div>
                                    <div>
                                      <div class="flex items-center gap-1.5">
                                        <span class="text-[9px] font-bold text-tenant-600 uppercase">
                                          {{ crs.structureConfig.layerLabels[1] || 'Tier 2' }}
                                        </span>
                                        @if (node2.instructorTags && node2.instructorTags.length > 0) {
                                          <span class="text-[9px] font-medium px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center gap-0.5">
                                            <span class="material-symbols-outlined text-[10px]">school</span>
                                            {{ node2.instructorTags[0].name }}
                                          </span>
                                        }
                                      </div>
                                      <h4 class="text-xs font-semibold text-text-primary">{{ node2.title }}</h4>
                                    </div>
                                  </div>
                                </div>

                                @if (isExpanded(node2.nodeId)) {
                                  <div class="p-3 bg-base-100 border-t border-base-300">
                                    @if (crs.structureConfig.layerCount === 2) {
                                      <!-- Direct leaf content under Layer 2 -->
                                      <div class="space-y-2">
                                        @for (item of node2.content || []; track item.contentId) {
                                          <div class="p-2.5 rounded-xl bg-base-200/50 border border-base-300/80 flex items-start justify-between gap-2 text-xs">
                                            <div class="flex items-start gap-2">
                                              <span class="material-symbols-outlined text-sm mt-0.5" [class]="item.family === 'learning' ? 'text-emerald-500' : 'text-indigo-500'">
                                                {{ getContentIcon(item) }}
                                              </span>
                                              <div>
                                                <div class="flex items-center gap-1 mb-0.5">
                                                  <span class="text-[9px] font-bold px-1.5 py-0.2 rounded" [class]="item.family === 'learning' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-indigo-500/10 text-indigo-600'">
                                                    {{ item.family | uppercase }}
                                                  </span>
                                                  @if (item.assessment?.gradingMode) {
                                                    <span class="text-[9px] font-semibold px-1 py-0.2 rounded" [class]="item.assessment?.gradingMode === 'manual' ? 'bg-amber-500/15 text-amber-700' : 'bg-slate-500/10 text-slate-600'">
                                                      {{ item.assessment?.gradingMode === 'manual' ? 'Manual Grading' : 'Auto' }}
                                                    </span>
                                                  }
                                                </div>
                                                <h5 class="font-semibold text-text-primary text-xs">{{ item.title }}</h5>
                                              </div>
                                            </div>
                                            <span class="text-[10px] text-text-secondary font-mono">
                                              {{ item.learning?.durationMinutes || item.assessment?.durationMinutes || 15 }}m
                                            </span>
                                          </div>
                                        }
                                      </div>
                                    } @else {
                                      <!-- Layer 3 Child Nodes -->
                                      <div class="pl-2 border-l-2 border-tenant-500/20 space-y-2">
                                        @for (node3 of node2.children || []; track node3.nodeId; let idx3 = $index) {
                                          <div class="rounded-xl border border-base-300/80 bg-base-200/20 p-2.5 space-y-2">
                                            <div class="flex items-center justify-between">
                                              <div class="flex items-center gap-1.5">
                                                <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-base-300 text-text-secondary font-mono">
                                                  {{ idx1 + 1 }}.{{ idx2 + 1 }}.{{ idx3 + 1 }}
                                                </span>
                                                <span class="text-xs font-bold text-text-primary">{{ node3.title }}</span>
                                              </div>
                                            </div>

                                            <!-- Leaf content under Layer 3 -->
                                            <div class="space-y-1.5 pl-2">
                                              @for (item of node3.content || []; track item.contentId) {
                                                <div class="p-2 rounded-lg bg-base-100 border border-base-300 flex items-center justify-between gap-2 text-xs">
                                                  <div class="flex items-center gap-2">
                                                    <span class="material-symbols-outlined text-sm" [class]="item.family === 'learning' ? 'text-emerald-500' : 'text-indigo-500'">
                                                      {{ getContentIcon(item) }}
                                                    </span>
                                                    <span class="font-medium text-text-primary text-xs">{{ item.title }}</span>
                                                  </div>
                                                  <div class="flex items-center gap-1.5">
                                                    @if (item.assessment?.gradingMode === 'manual') {
                                                      <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700">
                                                        Manual
                                                      </span>
                                                    }
                                                    <span class="text-[10px] text-text-secondary font-mono">
                                                      {{ item.learning?.durationMinutes || item.assessment?.durationMinutes || 15 }}m
                                                    </span>
                                                  </div>
                                                </div>
                                              }
                                            </div>
                                          </div>
                                        }
                                      </div>
                                    }
                                  </div>
                                }
                              </div>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              } @else {
                <div class="p-8 text-center bg-base-200/50 rounded-2xl border border-base-300 text-text-secondary">
                  <span class="material-symbols-outlined text-4xl text-text-secondary/60 mb-2">account_tree</span>
                  <p class="text-xs font-medium">No structure defined for this course yet.</p>
                </div>
              }
            </div>
          </div>

          <!-- Modal Footer (Matching Version Modal Footer) -->
          <div class="p-6 border-t border-base-300 bg-base-200/50 flex items-center justify-between">
            <button 
              type="button"
              (click)="close.emit()" 
              class="px-4 py-2.5 rounded-xl border border-base-300 hover:bg-base-200 text-text-secondary font-semibold text-xs transition-colors cursor-pointer">
              Close
            </button>

            <button 
              type="button"
              (click)="edit.emit(crs)" 
              class="px-4 py-2.5 rounded-xl bg-tenant-500 hover:bg-tenant-600 text-white font-semibold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer">
              <span class="material-symbols-outlined text-sm">edit</span>
              <span>Open in Course Editor</span>
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class CourseStructureDrawerComponent {
  course = input<CourseEntity | null>(null);
  close = output<void>();
  edit = output<CourseEntity>();

  expandedNodes = signal<Set<string>>(new Set<string>());
  allExpanded = signal<boolean>(true);

  constructor() {
    this.expandAll();
  }

  isExpanded(nodeId: string): boolean {
    return this.expandedNodes().has(nodeId);
  }

  toggleNode(nodeId: string) {
    this.expandedNodes.update(set => {
      const next = new Set(set);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }

  expandAll() {
    const set = new Set<string>();
    const crs = this.course();
    if (crs && crs.structure) {
      function addIds(nodes: CourseStructureNode[]) {
        for (const n of nodes) {
          set.add(n.nodeId);
          if (n.children) addIds(n.children);
        }
      }
      addIds(crs.structure);
    }
    this.expandedNodes.set(set);
    this.allExpanded.set(true);
  }

  toggleExpandAll() {
    if (this.allExpanded()) {
      this.expandedNodes.set(new Set());
      this.allExpanded.set(false);
    } else {
      this.expandAll();
    }
  }

  getMetrics(crs: CourseEntity) {
    return summarizeCourseMetrics(crs);
  }

  getChildCountText(node: CourseStructureNode, layerCount: number): string {
    if (layerCount === 1) {
      return `${node.content?.length || 0} items`;
    }
    return `${node.children?.length || 0} child sections`;
  }

  getContentIcon(item: CourseContentItem): string {
    if (item.family === 'learning') {
      const sub = item.learning?.subtype;
      if (sub === 'video') return 'smart_display';
      if (sub === 'audio') return 'headphones';
      if (sub === 'document') return 'description';
      if (sub === 'interactive') return 'extension';
      return 'article';
    } else {
      const sub = item.assessment?.subtype;
      if (sub === 'quiz') return 'quiz';
      if (sub === 'assignment') return 'assignment';
      return 'ballot';
    }
  }
}
