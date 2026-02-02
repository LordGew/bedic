import { Component, OnInit } from '@angular/core';
import { AchievementService } from '../achievement.service';
import { Achievement, TitleConfig, LevelConfig } from '../achievement.model';

@Component({
  selector: 'app-achievements-management',
  templateUrl: './achievements-management.component.html',
  styleUrls: ['./achievements-management.component.scss']
})
export class AchievementsManagementComponent implements OnInit {
  activeTab = 'achievements'; // achievements, titles, levels

  // Logros
  achievements: Achievement[] = [];
  filteredAchievements: Achievement[] = [];
  selectedAchievement: Achievement | null = null;
  showAchievementModal = false;
  achievementFilter = 'ALL';
  loadingAchievements = false;

  // Títulos
  titles: TitleConfig[] = [];
  filteredTitles: TitleConfig[] = [];
  selectedTitle: TitleConfig | null = null;
  showTitleModal = false;
  titleFilter = 'ALL';
  loadingTitles = false;

  // Niveles
  levels: LevelConfig[] = [];
  selectedLevel: LevelConfig | null = null;
  showLevelModal = false;
  loadingLevels = false;

  // Formulario
  formData: any = {};
  isEditing = false;
  saving = false;

  // Otorgar manualmente
  showGrantModal = false;
  grantUserId = '';
  grantItemId = '';
  grantType = 'achievement'; // achievement o title

  categoryOptions = [
    { value: 'ALL', label: 'Todos' },
    { value: 'CONTRIBUTION', label: 'Contribución' },
    { value: 'COMMUNITY', label: 'Comunidad' },
    { value: 'EXPLORATION', label: 'Exploración' },
    { value: 'ENGAGEMENT', label: 'Participación' },
    { value: 'SPECIAL', label: 'Especial' }
  ];

  rarityOptions = [
    { value: 'COMMON', label: 'Común' },
    { value: 'UNCOMMON', label: 'Poco común' },
    { value: 'RARE', label: 'Raro' },
    { value: 'EPIC', label: 'Épico' },
    { value: 'LEGENDARY', label: 'Legendario' }
  ];

  titleCategoryOptions = [
    { value: 'level', label: 'Por Nivel' },
    { value: 'contributor', label: 'Contribuidor' },
    { value: 'explorer', label: 'Explorador' },
    { value: 'community', label: 'Comunidad' },
    { value: 'referral', label: 'Referidos' },
    { value: 'special', label: 'Especial' },
    { value: 'seasonal', label: 'Temporal' }
  ];

  requirementTypeOptions = [
    { value: 'REVIEWS_COUNT', label: 'Reseñas' },
    { value: 'PLACES_VISITED', label: 'Lugares Visitados' },
    { value: 'REPORTS_FILED', label: 'Reportes' },
    { value: 'COMMENTS_COUNT', label: 'Comentarios' },
    { value: 'EVENTS_ATTENDED', label: 'Eventos' },
    { value: 'RATINGS_GIVEN', label: 'Calificaciones' },
    { value: 'CUSTOM', label: 'Personalizado' }
  ];

  constructor(private achievementService: AchievementService) { }

  ngOnInit(): void {
    this.loadAchievements();
    this.loadTitles();
    this.loadLevels();
  }

  // ========================================
  // LOGROS
  // ========================================

  loadAchievements(): void {
    this.loadingAchievements = true;
    this.achievementService.getAllAchievements()
      .subscribe({
        next: (response) => {
          this.achievements = response.data;
          this.filterAchievements();
          this.loadingAchievements = false;
        },
        error: (err) => {
          alert('Error al cargar logros: ' + err.message);
          this.loadingAchievements = false;
        }
      });
  }

  filterAchievements(): void {
    if (this.achievementFilter === 'ALL') {
      this.filteredAchievements = this.achievements;
    } else {
      this.filteredAchievements = this.achievements.filter(a => a.category === this.achievementFilter);
    }
  }

  openAchievementModal(achievement?: Achievement): void {
    if (achievement) {
      this.selectedAchievement = achievement;
      this.formData = { ...achievement };
      this.isEditing = true;
    } else {
      this.selectedAchievement = null;
      this.formData = {
        category: 'SPECIAL',
        rarity: 'COMMON',
        isActive: true,
        rewards: { xp: 0 },
        requirements: { type: 'CUSTOM', value: 0 }
      };
      this.isEditing = false;
    }
    this.showAchievementModal = true;
  }

  closeAchievementModal(): void {
    this.showAchievementModal = false;
    this.selectedAchievement = null;
    this.formData = {};
  }

  saveAchievement(): void {
    if (!this.formData.name || !this.formData.description) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    this.saving = true;
    const request = this.isEditing
      ? this.achievementService.updateAchievement(this.selectedAchievement!._id, this.formData)
      : this.achievementService.createAchievement(this.formData);

    request.subscribe({
      next: () => {
        alert(this.isEditing ? 'Logro actualizado' : 'Logro creado');
        this.closeAchievementModal();
        this.loadAchievements();
        this.saving = false;
      },
      error: (err) => {
        alert('Error: ' + err.message);
        this.saving = false;
      }
    });
  }

  deleteAchievement(id: string): void {
    if (!confirm('¿Estás seguro de que deseas eliminar este logro?')) return;

    this.achievementService.deleteAchievement(id).subscribe({
      next: () => {
        alert('Logro eliminado');
        this.loadAchievements();
      },
      error: (err) => {
        alert('Error: ' + err.message);
      }
    });
  }

  // ========================================
  // TÍTULOS
  // ========================================

  loadTitles(): void {
    this.loadingTitles = true;
    this.achievementService.getAllTitles()
      .subscribe({
        next: (response) => {
          this.titles = response.data;
          this.filterTitles();
          this.loadingTitles = false;
        },
        error: (err) => {
          alert('Error al cargar títulos: ' + err.message);
          this.loadingTitles = false;
        }
      });
  }

  filterTitles(): void {
    if (this.titleFilter === 'ALL') {
      this.filteredTitles = this.titles;
    } else {
      this.filteredTitles = this.titles.filter(t => t.category === this.titleFilter);
    }
  }

  openTitleModal(title?: TitleConfig): void {
    if (title) {
      this.selectedTitle = title;
      this.formData = { ...title };
      this.isEditing = true;
    } else {
      this.selectedTitle = null;
      this.formData = {
        category: 'special',
        rarity: 'common',
        active: true,
        color: '#9B5CFF',
        isLimited: false,
        unlockConditions: {}
      };
      this.isEditing = false;
    }
    this.showTitleModal = true;
  }

  closeTitleModal(): void {
    this.showTitleModal = false;
    this.selectedTitle = null;
    this.formData = {};
  }

  saveTitle(): void {
    if (!this.formData.name || !this.formData.description) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    this.saving = true;
    const request = this.isEditing
      ? this.achievementService.updateTitle(this.selectedTitle!._id, this.formData)
      : this.achievementService.createTitle(this.formData);

    request.subscribe({
      next: () => {
        alert(this.isEditing ? 'Título actualizado' : 'Título creado');
        this.closeTitleModal();
        this.loadTitles();
        this.saving = false;
      },
      error: (err) => {
        alert('Error: ' + err.message);
        this.saving = false;
      }
    });
  }

  deleteTitle(id: string): void {
    if (!confirm('¿Estás seguro de que deseas eliminar este título?')) return;

    this.achievementService.deleteTitle(id).subscribe({
      next: () => {
        alert('Título eliminado');
        this.loadTitles();
      },
      error: (err) => {
        alert('Error: ' + err.message);
      }
    });
  }

  // ========================================
  // NIVELES
  // ========================================

  loadLevels(): void {
    this.loadingLevels = true;
    this.achievementService.getLevelConfigs()
      .subscribe({
        next: (response) => {
          this.levels = response.data;
          this.loadingLevels = false;
        },
        error: (err) => {
          alert('Error al cargar niveles: ' + err.message);
          this.loadingLevels = false;
        }
      });
  }

  openLevelModal(level?: LevelConfig): void {
    if (level) {
      this.selectedLevel = level;
      this.formData = { ...level };
      this.isEditing = true;
    } else {
      this.selectedLevel = null;
      this.formData = {
        level: this.levels.length + 1,
        minXP: 0,
        maxXP: 0,
        rewards: { xp: 0 }
      };
      this.isEditing = false;
    }
    this.showLevelModal = true;
  }

  closeLevelModal(): void {
    this.showLevelModal = false;
    this.selectedLevel = null;
    this.formData = {};
  }

  saveLevel(): void {
    if (!this.formData.name || this.formData.minXP === undefined) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    this.saving = true;
    const request = this.isEditing
      ? this.achievementService.updateLevelConfig(this.selectedLevel!.level, this.formData)
      : this.achievementService.createLevelConfig(this.formData);

    request.subscribe({
      next: () => {
        alert(this.isEditing ? 'Nivel actualizado' : 'Nivel creado');
        this.closeLevelModal();
        this.loadLevels();
        this.saving = false;
      },
      error: (err) => {
        alert('Error: ' + err.message);
        this.saving = false;
      }
    });
  }

  // ========================================
  // OTORGAR MANUALMENTE
  // ========================================

  openGrantModal(type: 'achievement' | 'title', itemId: string): void {
    this.grantType = type;
    this.grantItemId = itemId;
    this.grantUserId = '';
    this.showGrantModal = true;
  }

  closeGrantModal(): void {
    this.showGrantModal = false;
    this.grantUserId = '';
    this.grantItemId = '';
  }

  grantItem(): void {
    if (!this.grantUserId || !this.grantItemId) {
      alert('Por favor completa todos los campos');
      return;
    }

    this.saving = true;
    const request = this.grantType === 'achievement'
      ? this.achievementService.grantAchievementToUser(this.grantUserId, this.grantItemId)
      : this.achievementService.grantTitleToUser(this.grantUserId, this.grantItemId);

    request.subscribe({
      next: (response) => {
        alert(response.message);
        this.closeGrantModal();
        this.saving = false;
      },
      error: (err) => {
        alert('Error: ' + err.message);
        this.saving = false;
      }
    });
  }

  getRarityColor(rarity: string): string {
    const colors: { [key: string]: string } = {
      'COMMON': '#95a5a6',
      'UNCOMMON': '#27ae60',
      'RARE': '#3498db',
      'EPIC': '#9b59b6',
      'LEGENDARY': '#f39c12'
    };
    return colors[rarity] || '#95a5a6';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES');
  }
}
