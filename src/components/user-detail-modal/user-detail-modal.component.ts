import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-detail-modal',
  templateUrl: './user-detail-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class UserDetailModalComponent {
  user = input<User | null>(null);
  closeModal = output<void>();

  onClose() {
    this.closeModal.emit();
  }

  // Stop propagation to prevent closing modal when clicking inside the panel
  onModalClick(event: MouseEvent) {
    event.stopPropagation();
  }
  
  get planColorMap() {
    return {
      Free: 'bg-sky-500/20 text-sky-400',
      Pro: 'bg-emerald-500/20 text-emerald-400',
      Enterprise: 'bg-violet-500/20 text-violet-400'
    };
  }

  get statusColorMap() {
    return {
      Active: 'bg-emerald-500/20 text-emerald-400',
      Banned: 'bg-rose-500/20 text-rose-400',
    };
  }
}
