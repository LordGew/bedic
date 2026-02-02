import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-details-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <h2>{{ data.title }}</h2>
        <button mat-icon-button (click)="onClose()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="modal-content">
        <div class="details-grid">
          <div class="detail-card" *ngFor="let item of detailsArray">
            <div class="card-label">{{ item.key }}</div>
            <div class="card-value">{{ item.value }}</div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button mat-raised-button color="primary" (click)="onClose()">Cerrar</button>
      </div>
    </div>
  `,
  styles: [`
    .modal-container {
      padding: 0;
      background-color: var(--background-color);
      color: var(--text-primary);
      min-width: 500px;
      max-width: 800px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid var(--border-color);
      background-color: var(--surface-color);
    }

    .modal-header h2 {
      margin: 0;
      font-size: 20px;
      color: var(--text-primary);
    }

    .close-btn {
      color: var(--text-secondary);
    }

    .close-btn:hover {
      color: var(--text-primary);
    }

    .modal-content {
      padding: 20px;
      max-height: 60vh;
      overflow-y: auto;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .detail-card {
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 15px;
      transition: all 0.3s ease;
    }

    .detail-card:hover {
      border-color: var(--primary-color);
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
      transform: translateY(-2px);
    }

    .card-label {
      font-size: 12px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .card-value {
      font-size: 16px;
      color: var(--primary-color);
      font-weight: 600;
      word-break: break-word;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 15px 20px;
      border-top: 1px solid var(--border-color);
      background-color: var(--surface-color);
    }

    @media (max-width: 600px) {
      .modal-container {
        min-width: 90vw;
      }

      .details-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Scrollbar personalizado */
    .modal-content::-webkit-scrollbar {
      width: 8px;
    }

    .modal-content::-webkit-scrollbar-track {
      background: var(--background-color);
    }

    .modal-content::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 4px;
    }

    .modal-content::-webkit-scrollbar-thumb:hover {
      background: var(--text-secondary);
    }
  `]
})
export class DetailsModalComponent {
  detailsArray: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<DetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.detailsArray = Object.entries(data.data).map(([key, value]) => ({
      key,
      value
    }));
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
