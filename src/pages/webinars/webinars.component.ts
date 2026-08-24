import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../services/lms-data.service';
import { LiveWebinar } from '../../models/lms.model';

@Component({
  selector: 'app-webinars',
  imports: [CommonModule, FormsModule],
  templateUrl: './webinars.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebinarsComponent {
  lms = inject(LmsDataService);

  showScheduleModal = signal<boolean>(false);
  activeVirtualRoom = signal<LiveWebinar | null>(null);

  // Mobile Bottom Sheet control: 'chat' | 'participants' | 'reactions' | null
  activeMobileSheet = signal<'chat' | 'participants' | 'reactions' | null>(null);

  // Audio / Video / Screen controls
  isMuted = signal<boolean>(false);
  isVideoOn = signal<boolean>(true);
  isScreenSharing = signal<boolean>(false);
  isHandRaised = signal<boolean>(false);
  isSpeakerView = signal<boolean>(true);
  isPiPMinimized = signal<boolean>(false);

  // Live session chat messages
  liveChatMessages = signal<Array<{ sender: string; time: string; text: string; isHost?: boolean }>>([
    { sender: 'Dr. Evelyn Reed', time: '10:02 AM', text: 'Welcome everyone! We will begin the case review in 2 minutes.', isHost: true },
    { sender: 'Marcus Vance', time: '10:03 AM', text: 'Audio and slide deck look crystal clear.' },
    { sender: 'Sarah Chen', time: '10:04 AM', text: 'Ready with our department compliance questions.' }
  ]);

  chatInput = signal<string>('');
  unreadChatCount = signal<number>(0);

  // Reactions
  reactions = ['👍', '👏', '❤️', '💡', '🔥', '🎉'];
  activeReactions = signal<Array<{ id: number; emoji: string; left: number }>>([]);
  private reactionIdSeq = 0;

  // New webinar form
  newWebinar = {
    title: '',
    hostName: '',
    platform: 'Zoom' as const,
    scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    durationMinutes: 60,
    courseTitle: ''
  };

  openScheduleModal() {
    this.newWebinar = {
      title: '',
      hostName: this.lms.activeUser().name,
      platform: 'Zoom',
      scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      durationMinutes: 60,
      courseTitle: this.lms.tenantCourses()[0]?.title || 'General Briefing'
    };
    this.showScheduleModal.set(true);
  }

  scheduleWebinar() {
    if (!this.newWebinar.title.trim()) return;

    this.lms.addWebinar({
      title: this.newWebinar.title,
      instructor: this.newWebinar.hostName || this.lms.activeUser().name,
      instructorAvatar: this.lms.activeUser().avatar,
      hostName: this.newWebinar.hostName || this.lms.activeUser().name,
      hostAvatar: this.lms.activeUser().avatar,
      platform: this.newWebinar.platform,
      joinUrl: 'https://zoom.us/j/demo',
      scheduledAt: new Date(this.newWebinar.scheduledAt).toISOString(),
      durationMinutes: Number(this.newWebinar.durationMinutes) || 60,
      attendeeCount: 1,
      courseTitle: this.newWebinar.courseTitle
    });

    this.showScheduleModal.set(false);
  }

  joinSession(webinar: LiveWebinar) {
    this.activeVirtualRoom.set(webinar);
    this.activeMobileSheet.set(null);
    this.unreadChatCount.set(0);
    this.isHandRaised.set(false);
    this.isMuted.set(false);
    this.isVideoOn.set(true);
  }

  leaveSession() {
    this.activeVirtualRoom.set(null);
    this.activeMobileSheet.set(null);
  }

  toggleMobileSheet(sheet: 'chat' | 'participants' | 'reactions') {
    if (this.activeMobileSheet() === sheet) {
      this.activeMobileSheet.set(null);
    } else {
      this.activeMobileSheet.set(sheet);
      if (sheet === 'chat') {
        this.unreadChatCount.set(0);
      }
    }
  }

  triggerReaction(emoji: string) {
    const id = ++this.reactionIdSeq;
    const left = Math.floor(Math.random() * 60) + 20; // 20% to 80% horizontal
    this.activeReactions.update(list => [...list, { id, emoji, left }]);
    
    // Auto cleanup floating reaction after 2.5s
    setTimeout(() => {
      this.activeReactions.update(list => list.filter(r => r.id !== id));
    }, 2500);

    if (this.activeMobileSheet() === 'reactions') {
      this.activeMobileSheet.set(null);
    }
  }

  toggleHandRaise() {
    this.isHandRaised.update(val => !val);
  }

  sendChatMessage() {
    const text = this.chatInput().trim();
    if (!text) return;

    const user = this.lms.activeUser();
    const isHost = this.lms.activeRole() === 'instructor' || this.lms.activeRole() === 'super_admin';
    
    this.liveChatMessages.update(prev => [
      ...prev,
      {
        sender: user.name,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text,
        isHost
      }
    ]);
    this.chatInput.set('');

    // Trigger slight reaction for interactivity
    if (text.includes('👍') || text.includes('agree')) {
      this.triggerReaction('👍');
    }
  }
}

