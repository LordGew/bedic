import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';
import { ReportDetailDialogComponent } from './report-detail-dialog.component';

interface ReportStats {
  totalReports: number;
  pendingReports: number;
  approvedReports: number;
  hiddenReports: number;
  rejectedReports: number;
  userBannedReports: number;
  averageResolutionTime: number;
  topReportedUsers: Array<{ name: string; count: number }>;
  reportsByType: Array<{ type: string; count: number }>;
  reportsByReason: Array<{ reason: string; count: number }>;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatDialogModule,
    MatChipsModule,
    MatSnackBarModule,
    FormsModule,
    TranslatePipe
  ],
  template: `
    <div class="reports-container">
      <div class="header">
        <h1>{{ 'reports.title' | translate }}</h1>
        <div class="header-actions">
          <button mat-raised-button [matMenuTriggerFor]="exportMenu">
            <mat-icon>download</mat-icon>
            {{ 'reports.export' | translate }}
          </button>
          <mat-menu #exportMenu="matMenu">
            <button mat-menu-item (click)="exportToCSV()">
              <mat-icon>table_chart</mat-icon>
              <span>{{ 'reports.export_csv' | translate }}</span>
            </button>
            <button mat-menu-item (click)="exportToExcel()">
              <mat-icon>description</mat-icon>
              <span>{{ 'reports.export_excel' | translate }}</span>
            </button>
            <button mat-menu-item (click)="exportToPDF()">
              <mat-icon>picture_as_pdf</mat-icon>
              <span>{{ 'reports.export_pdf' | translate }}</span>
            </button>
          </mat-menu>
          <button mat-raised-button (click)="refreshData()">
            <mat-icon>refresh</mat-icon>
            {{ 'common.refresh' | translate }}
          </button>
        </div>
      </div>

      <mat-tab-group [(selectedIndex)]="selectedTabIndex">
        <!-- Overview Tab -->
        <mat-tab label="Resumen">
          <div class="tab-content">
            <div class="stats-grid">
              <mat-card class="stat-card" (click)="openReportsTab()">
                <mat-card-content>
                  <div class="stat-value">{{ stats.totalReports }}</div>
                  <div class="stat-label">{{ 'reports.total' | translate }}</div>
                  <mat-icon class="stat-icon">assessment</mat-icon>
                </mat-card-content>
              </mat-card>

              <mat-card class="stat-card pending" (click)="openReportsTab('PENDING')">
                <mat-card-content>
                  <div class="stat-value">{{ stats.pendingReports }}</div>
                  <div class="stat-label">{{ 'reports.pending' | translate }}</div>
                  <mat-icon class="stat-icon">schedule</mat-icon>
                </mat-card-content>
              </mat-card>

              <mat-card class="stat-card verified" (click)="openReportsTab('APPROVED')">
                <mat-card-content>
                  <div class="stat-value">{{ stats.approvedReports }}</div>
                  <div class="stat-label">{{ 'reports.approved' | translate }}</div>
                  <mat-icon class="stat-icon">check_circle</mat-icon>
                </mat-card-content>
              </mat-card>

              <mat-card class="stat-card hidden" (click)="openReportsTab('HIDDEN')">
                <mat-card-content>
                  <div class="stat-value">{{ stats.hiddenReports }}</div>
                  <div class="stat-label">{{ 'reports.hidden' | translate }}</div>
                  <mat-icon class="stat-icon">visibility_off</mat-icon>
                </mat-card-content>
              </mat-card>

              <mat-card class="stat-card rejected" (click)="openReportsTab('DELETED')">
                <mat-card-content>
                  <div class="stat-value">{{ stats.rejectedReports }}</div>
                  <div class="stat-label">{{ 'reports.rejected' | translate }}</div>
                  <mat-icon class="stat-icon">cancel</mat-icon>
                </mat-card-content>
              </mat-card>

              <mat-card class="stat-card banned" (click)="openReportsTab('USER_BANNED')">
                <mat-card-content>
                  <div class="stat-value">{{ stats.userBannedReports }}</div>
                  <div class="stat-label">{{ 'reports.banned_users' | translate }}</div>
                  <mat-icon class="stat-icon">block</mat-icon>
                </mat-card-content>
              </mat-card>

              <mat-card class="stat-card auto-moderated">
                <mat-card-content>
                  <div class="stat-value">{{ autoModeratorStats.autoModeratedCount }}</div>
                  <div class="stat-label">🤖 {{ 'reports.auto_moderated' | translate }}</div>
                  <mat-icon class="stat-icon">smart_toy</mat-icon>
                </mat-card-content>
              </mat-card>

              <mat-card class="stat-card manual-moderated">
                <mat-card-content>
                  <div class="stat-value">{{ autoModeratorStats.manualModeratedCount }}</div>
                  <div class="stat-label">👤 {{ 'reports.manually_moderated' | translate }}</div>
                  <mat-icon class="stat-icon">person</mat-icon>
                </mat-card-content>
              </mat-card>
            </div>

            <!-- Information Panel -->
            <mat-card class="info-panel">
              <mat-card-header>
                <mat-card-title>ℹ️ {{ 'reports.how_it_works' | translate }}</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="info-grid">
                  <div class="info-item">
                    <strong>📊 {{ 'reports.statistics' | translate }}</strong>
                    <p>{{ 'reports.statistics_desc' | translate }}</p>
                  </div>
                  <div class="info-item">
                    <strong>🤖 {{ 'reports.auto_moderation' | translate }}</strong>
                    <p>{{ 'reports.auto_moderation_desc' | translate }}</p>
                    <p style="margin-top: 8px; font-size: 12px; color: var(--text-secondary);">
                      <strong>{{ 'reports.auto_moderation_criteria' | translate }}</strong><br>
                      • {{ 'reports.criteria_toxicity' | translate }}<br>
                      • {{ 'reports.criteria_spam' | translate }}<br>
                      • {{ 'reports.criteria_keywords' | translate }}<br>
                      • {{ 'reports.criteria_patterns' | translate }}<br>
                      • {{ 'reports.criteria_multiple' | translate }}
                    </p>
                  </div>
                  <div class="info-item">
                    <strong>🔍 {{ 'reports.advanced_filters' | translate }}</strong>
                    <p>{{ 'reports.advanced_filters_desc' | translate }}</p>
                  </div>
                  <div class="info-item">
                    <strong>📥 {{ 'reports.data_export' | translate }}</strong>
                    <p>{{ 'reports.data_export_desc' | translate }}</p>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <div class="charts-grid">
              <!-- Reports by Type Chart -->
              <mat-card class="chart-card">
                <mat-card-header>
                  <mat-card-title>{{ 'reports.by_type' | translate }}</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="chart-container">
                    <div class="chart-bars-dynamic">
                      <div *ngFor="let item of stats.reportsByType; let i = index" class="bar-group">
                        <div class="bar-wrapper">
                          <div class="bar" 
                            [style.height.%]="calculateBarHeight(item.count, stats.reportsByType)" 
                            [style.background-color]="getNeutralColor(i)"
                            [matTooltip]="item.type + ': ' + item.count">
                          </div>
                        </div>
                        <span class="label">{{ item.type }}</span>
                        <span class="count">{{ item.count }}</span>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Reports by Reason Chart -->
              <mat-card class="chart-card">
                <mat-card-header>
                  <mat-card-title>{{ 'reports.by_reason' | translate }}</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="chart-container">
                    <div class="chart-bars-dynamic">
                      <div *ngFor="let item of stats.reportsByReason; let i = index" class="bar-group">
                        <div class="bar-wrapper">
                          <div class="bar" 
                            [style.height.%]="calculateBarHeight(item.count, stats.reportsByReason)" 
                            [style.background-color]="getNeutralColor(i)"
                            [matTooltip]="item.reason + ': ' + item.count">
                          </div>
                        </div>
                        <span class="label">{{ item.reason }}</span>
                        <span class="count">{{ item.count }}</span>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Places Classification Chart -->
              <mat-card class="chart-card">
                <mat-card-header>
                  <mat-card-title>{{ 'reports.top_reported_places' | translate }}</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="chart-container">
                    <div class="dynamic-chart-container">
                      <div class="chart-bars-horizontal">
                        <div *ngFor="let place of getTopPlaces(); let i = index" class="bar-item">
                          <div class="bar-label">
                            <span class="label-text">{{ place.name }}</span>
                            <span class="label-count">{{ place.count }}</span>
                          </div>
                          <div class="bar-wrapper">
                            <div class="bar" 
                              [style.width.%]="(place.count / (getTopPlaces()[0]?.count || 1)) * 100"
                              [style.background-color]="getPlaceClassificationColor(place)"
                              [style.box-shadow]="'0 2px 8px ' + getPlaceClassificationColor(place) + '40'">
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Users Classification Chart -->
              <mat-card class="chart-card">
                <mat-card-header>
                  <mat-card-title>{{ 'reports.top_reported_users' | translate }}</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="chart-container">
                    <div class="dynamic-chart-container">
                      <div class="chart-bars-horizontal">
                        <div *ngFor="let user of getTopUsers(); let i = index" class="bar-item">
                          <div class="bar-label">
                            <span class="label-text">{{ user.name }}</span>
                            <span class="label-count">{{ user.count }}</span>
                          </div>
                          <div class="bar-wrapper">
                            <div class="bar" 
                              [style.width.%]="(user.count / (getTopUsers()[0]?.count || 1)) * 100"
                              [style.background-color]="getUserClassificationColor(user)"
                              [style.box-shadow]="'0 2px 8px ' + getUserClassificationColor(user) + '40'">
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Filters Tab -->
        <mat-tab [label]="'common.filter' | translate">
          <div class="tab-content">
            <mat-card class="filter-card">
              <mat-card-header>
                <mat-card-title>{{ 'reports.filter_reports' | translate }}</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                  <div class="filters-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>{{ 'reports.report_type' | translate }}</mat-label>
                    <mat-select [(ngModel)]="selectedType" (selectionChange)="applyFilters()">
                      <mat-option value="">{{ 'common.all' | translate }}</mat-option>
                      <mat-option value="COMMENT">{{ 'reports.type_comment' | translate }}</mat-option>
                      <mat-option value="REVIEW">{{ 'reports.type_review' | translate }}</mat-option>
                      <mat-option value="PLACE">{{ 'reports.type_place' | translate }}</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>{{ 'common.status' | translate }}</mat-label>
                    <mat-select [(ngModel)]="selectedStatus" (selectionChange)="applyFilters()">
                      <mat-option value="">{{ 'common.all' | translate }}</mat-option>
                      <mat-option value="PENDING">{{ 'reports.status_pending' | translate }}</mat-option>
                      <mat-option value="APPROVED">{{ 'reports.status_approved' | translate }}</mat-option>
                      <mat-option value="DELETED">{{ 'reports.status_rejected' | translate }}</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>{{ 'reports.moderation_type' | translate }}</mat-label>
                    <mat-select [(ngModel)]="selectedModerationType" (selectionChange)="applyFilters()">
                      <mat-option value="">{{ 'common.all' | translate }}</mat-option>
                      <mat-option value="auto">{{ 'reports.auto_moderated' | translate }}</mat-option>
                      <mat-option value="manual">{{ 'reports.manually_moderated' | translate }}</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>{{ 'reports.severity' | translate }}</mat-label>
                    <mat-select [(ngModel)]="selectedSeverity" (selectionChange)="applyFilters()">
                      <mat-option value="">{{ 'common.all' | translate }}</mat-option>
                      <mat-option value="low">{{ 'reports.severity_low' | translate }}</mat-option>
                      <mat-option value="medium">{{ 'reports.severity_medium' | translate }}</mat-option>
                      <mat-option value="high">{{ 'reports.severity_high' | translate }}</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>{{ 'reports.from_date' | translate }}</mat-label>
                    <input matInput [matDatepicker]="startPicker" [(ngModel)]="startDate" (dateChange)="applyFilters()">
                    <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                    <mat-datepicker #startPicker></mat-datepicker>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>{{ 'reports.until' | translate }}</mat-label>
                    <input matInput [matDatepicker]="endPicker" [(ngModel)]="endDate" (dateChange)="applyFilters()">
                    <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                    <mat-datepicker #endPicker></mat-datepicker>
                  </mat-form-field>
                </div>

                <div class="filter-actions">
                  <button mat-raised-button color="primary" (click)="applyFilters()">
                    <mat-icon>filter_list</mat-icon>
                    {{ 'reports.apply_filters' | translate }}
                  </button>
                  <button mat-raised-button (click)="clearFilters()">
                    <mat-icon>clear</mat-icon>
                    {{ 'common.cancel' | translate }}
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Top Users Tab -->
        <mat-tab [label]="'reports.top_reporting_users' | translate">
          <div class="tab-content">
            <mat-card class="users-card">
              <mat-card-header>
                <mat-card-title>{{ 'reports.top_10_reporting_users' | translate }}</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="users-list">
                  <div *ngFor="let user of stats.topReportedUsers; let i = index" class="user-item">
                    <div class="rank">{{ i + 1 }}</div>
                    <div class="user-info">
                      <span class="name">{{ user.name }}</span>
                    </div>
                    <div class="count">{{ user.count }} {{ 'reports.count_label' | translate }}</div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Reports Table Tab -->
        <mat-tab [label]="'reports.all_reports' | translate">
          <div class="tab-content">
            <mat-card class="reports-table-card">
              <mat-card-header>
                <mat-card-title>{{ 'reports.reports_list' | translate }}</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="table-container">
                  <table mat-table [dataSource]="reports" class="reports-table">
                    <!-- ID Column -->
                    <ng-container matColumnDef="id">
                      <th mat-header-cell *matHeaderCellDef>ID</th>
                      <td mat-cell *matCellDef="let element">{{ element.id | slice:0:8 }}...</td>
                    </ng-container>

                    <!-- Type Column -->
                    <ng-container matColumnDef="type">
                      <th mat-header-cell *matHeaderCellDef>{{ 'reports.type' | translate }}</th>
                      <td mat-cell *matCellDef="let element">{{ element.contentType }}</td>
                    </ng-container>

                    <!-- User Column -->
                    <ng-container matColumnDef="user">
                      <th mat-header-cell *matHeaderCellDef>{{ 'common.user' | translate }}</th>
                      <td mat-cell *matCellDef="let element">&#64;{{ element.userName }}</td>
                    </ng-container>

                    <!-- Reason Column -->
                    <ng-container matColumnDef="reason">
                      <th mat-header-cell *matHeaderCellDef>{{ 'reports.reason' | translate }}</th>
                      <td mat-cell *matCellDef="let element">{{ element.displayReason || element.reason }}</td>
                    </ng-container>

                    <!-- Status Column -->
                    <ng-container matColumnDef="status">
                      <th mat-header-cell *matHeaderCellDef>{{ 'common.status' | translate }}</th>
                      <td mat-cell *matCellDef="let element">
                        <span *ngIf="element.moderationAction as action"
                              [ngClass]="'status-' + action.toLowerCase()">
                          {{ getModerationActionLabel(action) }}
                        </span>
                        <span *ngIf="!element.moderationAction" class="status-pending">
                          {{ getModerationActionLabel('PENDING') }}
                        </span>
                      </td>
                    </ng-container>

                    <!-- Date Column -->
                    <ng-container matColumnDef="date">
                      <th mat-header-cell *matHeaderCellDef>{{ 'common.date' | translate }}</th>
                      <td mat-cell *matCellDef="let element">{{ element.createdAt | date:'short' }}</td>
                    </ng-container>

                    <!-- Actions Column -->
                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef>{{ 'common.actions' | translate }}</th>
                      <td mat-cell *matCellDef="let element">
                        <button mat-icon-button matTooltip="Ver detalle y gestionar" (click)="openReportDetail(element)">
                          <mat-icon>visibility</mat-icon>
                        </button>
                        <button mat-icon-button matTooltip="Marcar como aprobado" 
                                (click)="quickVerify(element)" 
                                *ngIf="element.moderationAction !== 'APPROVED'">
                          <mat-icon>check_circle</mat-icon>
                        </button>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                  </table>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>

      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>{{ 'reports.loading' | translate }}</p>
      </div>
    </div>
  `,
  styles: [`
    .reports-container {
      padding: 20px;
      background-color: var(--background-color);
      color: var(--text-primary);
      min-height: 100vh;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;

      h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 500;
        color: var(--text-primary);
      }

      .header-actions {
        display: flex;
        gap: 10px;
      }
    }

    .tab-content {
      padding: 20px;
      background-color: var(--background-color);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;

      .stat-card {
        background-color: var(--surface-color);
        color: var(--text-primary);
        position: relative;
        overflow: hidden;
        border: 1px solid var(--border-color);
        border-radius: 8px;

        mat-card-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 30px 20px;

          .stat-value {
            font-size: 36px;
            font-weight: 700;
            color: var(--primary-color);
          }

          .stat-label {
            font-size: 14px;
            color: var(--text-secondary);
            margin-top: 10px;
            text-align: center;
          }

          .stat-icon {
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 40px;
            width: 40px;
            height: 40px;
            opacity: 0.1;
          }
        }

        &.pending {
          border-left: 4px solid #ff9800;

          .stat-value {
            color: #ff9800;
          }
        }

        &.verified {
          border-left: 4px solid #4caf50;

          .stat-value {
            color: #4caf50;
          }
        }

        &.rejected {
          border-left: 4px solid #f44336;

          .stat-value {
            color: #f44336;
          }
        }

        &.hidden {
          border-left: 4px solid #9c27b0;

          .stat-value {
            color: #9c27b0;
          }
        }

        &.banned {
          border-left: 4px solid #d32f2f;

          .stat-value {
            color: #d32f2f;
          }
        }
      }
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;

      .chart-card {
        background-color: var(--surface-color);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        border-radius: 8px;

        mat-card-header {
          margin-bottom: 20px;

          mat-card-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary);
          }
        }

        .chart-placeholder {
          text-align: center;

          p {
            color: var(--text-secondary);
            margin-bottom: 20px;
          }

          .chart-bars {
            display: flex;
            align-items: flex-end;
            justify-content: space-around;
            height: 200px;
            gap: 10px;

            .chart-bar {
              display: flex;
              flex-direction: column;
              align-items: center;
              flex: 1;

              .bar {
                width: 100%;
                background: linear-gradient(to top, var(--primary-color), var(--primary-dark));
                border-radius: 4px 4px 0 0;
                min-height: 20px;
              }

              span {
                font-size: 12px;
                margin-top: 8px;
                color: var(--text-secondary);

                &.count {
                  font-weight: 600;
                  color: var(--text-primary);
                }
              }
            }
          }
        }
      }
    }

    .filter-card {
      background-color: var(--surface-color);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;

      mat-card-header {
        mat-card-title {
          color: var(--text-primary);
        }
      }

      .filters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-bottom: 20px;

        mat-form-field {
          width: 100%;
        }
      }

      .filter-actions {
        display: flex;
        gap: 10px;

        button {
          flex: 1;
        }
      }
    }

    .users-card {
      background-color: var(--surface-color);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;

      mat-card-header {
        mat-card-title {
          color: var(--text-primary);
        }
      }

      .users-list {
        display: flex;
        flex-direction: column;
        gap: 10px;

        .user-item {
          display: flex;
          align-items: center;
          padding: 15px;
          background-color: var(--background-color);
          border-radius: 4px;
          gap: 15px;
          border: 1px solid var(--border-color);

          .rank {
            font-size: 18px;
            font-weight: 700;
            color: var(--primary-color);
            min-width: 30px;
            text-align: center;
          }

          .user-info {
            flex: 1;

            .name {
              font-weight: 600;
              color: var(--text-primary);
            }
          }

          .count {
            color: var(--text-secondary);
            font-size: 14px;
            min-width: 100px;
            text-align: right;
          }
        }
      }
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 20px;

      p {
        color: var(--text-secondary);
        font-size: 16px;
      }
    }

    /* Dark theme overrides */
    :root.dark-theme {
      .reports-container {
        background-color: #121212;
      }

      .tab-content {
        background-color: #121212;
      }

      .stat-card {
        background-color: #1e1e1e !important;
        border-color: #333 !important;
      }

      .chart-card {
        background-color: #1e1e1e !important;
        border-color: #333 !important;
      }

      .filter-card {
        background-color: #1e1e1e !important;
        border-color: #333 !important;
      }

      .users-card {
        background-color: #1e1e1e !important;
        border-color: #333 !important;
      }

      .user-item {
        background-color: #121212 !important;
        border-color: #333 !important;
      }

      .reports-table-card {
        background-color: #1e1e1e !important;
        border-color: #333 !important;
      }

      .reports-table {
        background-color: #1e1e1e !important;

        th {
          background-color: #121212 !important;
          color: var(--text-primary) !important;
        }

        td {
          color: var(--text-primary) !important;
          border-color: #333 !important;
        }

        tr:hover {
          background-color: rgba(102, 126, 234, 0.1) !important;
        }
      }

      .status-pending {
        color: #ff9800;
        font-weight: 600;
      }

      .status-approved {
        color: #4caf50;
        font-weight: 600;
      }

      .status-deleted {
        color: #f44336;
        font-weight: 600;
      }

      .status-hidden {
        color: #9c27b0;
        font-weight: 600;
      }

      .status-user_banned {
        color: #f44336;
        font-weight: 600;
      }
    }

    .reports-table-card {
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
    }

    .table-container {
      overflow-x: auto;
    }

    .reports-table {
      width: 100%;
      background-color: var(--surface-color);

      th {
        background-color: var(--background-color);
        color: var(--text-primary);
        font-weight: 600;
        padding: 16px;
        border-bottom: 2px solid var(--border-color);
      }

      td {
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-color);
        color: var(--text-primary);
      }

      tr:hover {
        background-color: rgba(102, 126, 234, 0.05);
      }
    }

    .status-pending {
      color: #ff9800;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      background-color: rgba(255, 152, 0, 0.1);
    }

    .status-approved {
      color: #4caf50;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      background-color: rgba(76, 175, 80, 0.1);
    }

    .status-deleted {
      color: #f44336;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      background-color: rgba(244, 67, 54, 0.1);
    }

    .status-hidden {
      color: #9c27b0;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      background-color: rgba(156, 39, 176, 0.1);
    }

    .status-user_banned {
      color: #f44336;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      background-color: rgba(244, 67, 54, 0.1);
    }

    .chart-container {
      padding: 20px 0;
    }

    .dynamic-chart-container {
      display: flex;
      flex-direction: column;
      gap: 15px;
      width: 100%;

      .chart-bars-horizontal {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .bar-item {
          display: flex;
          flex-direction: column;
          gap: 6px;

          .bar-label {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 4px;

            .label-text {
              font-size: 13px;
              font-weight: 500;
              color: var(--text-primary);
              flex: 1;
            }

            .label-count {
              font-size: 14px;
              font-weight: 700;
              color: var(--primary-color);
              min-width: 40px;
              text-align: right;
            }
          }

          .bar-wrapper {
            width: 100%;
            height: 24px;
            background-color: var(--background-color);
            border-radius: 4px;
            overflow: hidden;
            border: 1px solid var(--border-color);

            .bar {
              height: 100%;
              border-radius: 3px;
              transition: width 0.3s ease, box-shadow 0.3s ease;
              min-width: 4px;

              &:hover {
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
              }
            }
          }
        }
      }
    }

    .chart-bars-dynamic {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .bar-group {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      padding: 12px;
      background-color: var(--background-color);
      border-radius: 6px;
      border: 1px solid var(--border-color);
      transition: all 0.3s ease;

      &:hover {
        background-color: rgba(102, 126, 234, 0.05);
        border-color: var(--primary-color);
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
      }

      .bar-wrapper {
        display: flex;
        align-items: flex-end;
        height: 60px;
        min-width: 40px;

        .bar {
          width: 100%;
          border-radius: 4px 4px 0 0;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

          &:hover {
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
        }
      }

      .label {
        flex: 1;
        font-size: 13px;
        font-weight: 500;
        color: var(--text-primary);
        word-break: break-word;
        line-height: 1.3;
        min-width: 80px;
      }

      .count {
        font-size: 14px;
        font-weight: 700;
        color: var(--primary-color);
        min-width: 40px;
        text-align: right;
        padding: 4px 8px;
        background-color: rgba(102, 126, 234, 0.1);
        border-radius: 4px;
      }
    }
  `]
})
export class ReportsComponent implements OnInit {
  stats: ReportStats = {
    totalReports: 0,
    pendingReports: 0,
    approvedReports: 0,
    hiddenReports: 0,
    rejectedReports: 0,
    userBannedReports: 0,
    averageResolutionTime: 0,
    topReportedUsers: [],
    reportsByType: [],
    reportsByReason: []
  };

  // Auto Moderator Statistics
  autoModeratorStats = {
    autoModeratedCount: 0,
    manualModeratedCount: 0,
    totalModerated: 0
  };

  reports: any[] = [];
  displayedColumns: string[] = ['id', 'type', 'user', 'reason', 'status', 'date', 'actions'];

  loading = false;
  reportsLoading = false;
  selectedType = '';
  selectedStatus = '';
  selectedSeverity = '';
  selectedModerationType = ''; // Nuevo: filtro de moderación manual/automática
  startDate: Date | null = null;
  endDate: Date | null = null;
  selectedTabIndex = 0;

  constructor(
    private adminService: AdminService,
    private languageService: LanguageService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadReports({ status: 'PENDING' });
  }

  loadStats(): void {
    this.loading = true;
    this.adminService.getReportsStats().subscribe({
      next: (stats: any) => {
        this.stats = stats;
        this.calculateAutoModeratorStats();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading stats:', err);
        this.showSnackBar('Error al cargar estadísticas de reportes', 'error');
        this.loading = false;
      }
    });
  }

  calculateAutoModeratorStats(): void {
    // Contar solo reportes que han sido moderados (no pendientes)
    const moderatedReports = this.reports.filter(r => r.moderationAction && r.moderationAction !== 'PENDING');
    const autoModerated = moderatedReports.filter(r => r.autoModerated).length;
    const manualModerated = moderatedReports.filter(r => !r.autoModerated).length;
    this.autoModeratorStats = {
      autoModeratedCount: autoModerated,
      manualModeratedCount: manualModerated,
      totalModerated: autoModerated + manualModerated
    };
  }

  loadReports(filters?: any): void {
    this.reportsLoading = true;
    this.adminService.getAllReports(filters).subscribe({
      next: (reports: any[]) => {
        // Eliminar duplicados usando Map con ID único
        const uniqueReports = new Map<string, any>();
        reports.forEach(r => {
          const reportId = r._id || r.id;
          if (!uniqueReports.has(reportId)) {
            uniqueReports.set(reportId, r);
          }
        });
        this.reports = Array.from(uniqueReports.values());
        this.reportsLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading reports:', err);
        this.reports = [];
        this.reportsLoading = false;
        const msg = err?.status === 401
          ? 'No autorizado. Inicia sesión nuevamente.'
          : err?.status === 403
            ? 'No tienes permisos para ver los reportes.'
            : 'Error al cargar reportes';
        this.showSnackBar(msg, 'error');
      }
    });
  }

  refreshData(): void {
    this.loadStats();
    this.loadReports();
  }

  applyFilters(): void {
    const filters: any = {};

    if (this.selectedStatus) {
      filters.status = this.selectedStatus;
    }

    if (this.selectedType) {
      filters.contentType = this.selectedType;
    }

    if (this.selectedModerationType) {
      filters.autoModerated = this.selectedModerationType === 'auto';
    }

    if (this.selectedSeverity) {
      filters.severity = this.selectedSeverity;
    }

    if (this.startDate) {
      filters.startDate = this.startDate.toISOString();
    }

    if (this.endDate) {
      filters.endDate = this.endDate.toISOString();
    }

    this.loadReports(filters);
  }

  clearFilters(): void {
    this.selectedType = '';
    this.selectedStatus = '';
    this.selectedSeverity = '';
    this.selectedModerationType = '';
    this.startDate = null;
    this.endDate = null;
    this.loadReports();
  }

  exportToCSV(): void {
    this.adminService.exportReports('csv').subscribe({
      next: (blob: Blob) => {
        this.downloadFile(blob, 'reportes.csv', 'text/csv');
        this.showSnackBar(this.languageService.translate('reports.export_csv'), 'success');
      },
      error: (err: any) => {
        console.error('Error exporting to CSV from backend, using local export:', err);
        this.exportToCSVLocal();
      }
    });
  }

  exportToCSVLocal(): void {
    const headers = ['Lugar', 'Tipo', 'Usuario', 'Razón', 'Estado', 'Auto-Moderado', 'Fecha'];
    const rows = this.reports.map(r => [
      r.placeName || 'N/A',
      r.contentType || 'N/A',
      r.userName || 'N/A',
      r.reason || 'N/A',
      r.moderationAction || 'N/A',
      r.autoModerated ? 'Sí' : 'No',
      new Date(r.createdAt).toLocaleString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    this.downloadFile(blob, 'reportes.csv', 'text/csv');
    this.showSnackBar('CSV exportado localmente', 'success');
  }

  exportToExcel(): void {
    this.adminService.exportReports('excel').subscribe({
      next: (blob: Blob) => {
        this.downloadFile(blob, 'reportes.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        this.showSnackBar(this.languageService.translate('reports.export_excel'), 'success');
      },
      error: (err: any) => {
        console.error('Error exporting to Excel from backend, using CSV fallback:', err);
        this.exportToCSVLocal();
      }
    });
  }

  exportToPDF(): void {
    this.adminService.exportReports('pdf').subscribe({
      next: (blob: Blob) => {
        this.downloadFile(blob, 'reportes.pdf', 'application/pdf');
        this.showSnackBar(this.languageService.translate('reports.export_pdf'), 'success');
      },
      error: (err: any) => {
        console.error('Error exporting to PDF from backend, using CSV fallback:', err);
        this.exportToCSVLocal();
      }
    });
  }

  private downloadFile(blob: Blob, filename: string, type: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Métodos para gráficas dinámicas con colores neutros
  getNeutralColor(index: number): string {
    const neutralColors = [
      '#6B7280', // Gris oscuro
      '#9CA3AF', // Gris medio
      '#D1D5DB', // Gris claro
      '#E5E7EB', // Gris muy claro
      '#F3F4F6', // Gris casi blanco
      '#8B8B8B', // Gris carbón
      '#A0A0A0', // Gris acero
      '#B0B0B0'  // Gris plata
    ];
    return neutralColors[index % neutralColors.length];
  }

  calculateBarHeight(count: number, items: any[]): number {
    if (!items || items.length === 0) return 0;
    const maxCount = Math.max(...items.map(i => i.count || 0));
    return maxCount === 0 ? 0 : (count / maxCount) * 100;
  }

  // Métodos para clasificación de lugares
  getTopPlaces(): any[] {
    const placesMap = new Map<string, { name: string; count: number }>();
    this.reports.forEach(r => {
      if (r.placeName) {
        const existing = placesMap.get(r.placeName);
        if (existing) {
          existing.count++;
        } else {
          placesMap.set(r.placeName, { name: r.placeName, count: 1 });
        }
      }
    });
    return Array.from(placesMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  getPlaceClassificationColor(place: any): string {
    const count = place.count || 0;
    if (count >= 10) return '#7C3AED'; // Púrpura - Crítico
    if (count >= 5) return '#F59E0B';  // Ámbar - Alto
    if (count >= 3) return '#10B981';  // Verde - Medio
    return '#6B7280';                   // Gris - Bajo
  }

  getPlaceClassificationLabel(place: any): string {
    const count = place.count || 0;
    if (count >= 10) return 'Crítico';
    if (count >= 5) return 'Alto';
    if (count >= 3) return 'Medio';
    return 'Bajo';
  }

  // Métodos para clasificación de usuarios
  getTopUsers(): any[] {
    const usersMap = new Map<string, { name: string; count: number }>();
    this.reports.forEach(r => {
      if (r.userName) {
        const existing = usersMap.get(r.userName);
        if (existing) {
          existing.count++;
        } else {
          usersMap.set(r.userName, { name: r.userName, count: 1 });
        }
      }
    });
    return Array.from(usersMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  getUserClassificationColor(user: any): string {
    const count = user.count || 0;
    if (count >= 10) return '#DC2626'; // Rojo - Crítico
    if (count >= 5) return '#EA580C';  // Naranja - Alto
    if (count >= 3) return '#0891B2';  // Cian - Medio
    return '#6B7280';                   // Gris - Bajo
  }

  getUserClassificationLabel(user: any): string {
    const count = user.count || 0;
    if (count >= 10) return 'Crítico';
    if (count >= 5) return 'Alto';
    if (count >= 3) return 'Medio';
    return 'Bajo';
  }

  openReportDetail(report: any): void {
    const reportId = report?.id || report?._id;
    if (!reportId) {
      this.showSnackBar('No se pudo abrir el reporte (ID inválido)', 'error');
      return;
    }

    this.reportsLoading = true;
    this.adminService.getReportDetail(reportId).subscribe({
      next: (detail: any) => {
        const dialogRef = this.dialog.open(ReportDetailDialogComponent, {
          width: '900px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          data: { report: detail },
          panelClass: 'report-detail-dialog-container'
        });

        this.reportsLoading = false;

        dialogRef.afterClosed().subscribe((result: any) => {
          if (result && result.updated) {
            this.loadReports();
            this.loadStats();
            this.showSnackBar('Reporte actualizado exitosamente', 'success');
          }
        });
      },
      error: (err: any) => {
        console.error('Error loading report detail:', err);
        this.reportsLoading = false;
        this.showSnackBar('Error al cargar detalle del reporte', 'error');
      }
    });
  }

  quickVerify(report: any): void {
    const body = {
      moderationAction: 'APPROVED',
      note: 'Verificado rápidamente desde la lista'
    };

    this.adminService.moderateReport(report.id, body).subscribe({
      next: (response) => {
        // Actualizar inmediatamente en el objeto local
        report.moderationAction = 'APPROVED';
        
        // Forzar detección de cambios
        this.reports = [...this.reports];
        
        this.showSnackBar('Reporte aprobado exitosamente', 'success');
        this.loadStats();
        this.loadReports();
      },
      error: (err: any) => {
        console.error('Error approving report:', err);
        this.showSnackBar('Error al aprobar el reporte', 'error');
      }
    });
  }

  openReportsTab(status?: string): void {
    this.selectedTabIndex = 3;
    const filters: any = {};
    if (status) {
      filters.status = status;
    }
    if (!status) {
      filters.status = 'PENDING';
    }
    this.loadReports(filters);
  }

  getModerationActionLabel(action: string): string {
    const map: Record<string, string> = {
      PENDING: 'Pendiente',
      APPROVED: 'Aprobado',
      HIDDEN: 'Oculto',
      DELETED: 'Borrado',
      USER_BANNED: 'Usuario baneado'
    };
    return map[action] || action || 'Pendiente';
  }

  private showSnackBar(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }
}
