import { Routes } from '@angular/router';
import { ModerationFeedCompleteComponent } from './moderation-feed-complete/moderation-feed-complete.component';
import { ModerationDetailComponent } from './moderation-detail/moderation-detail.component';

export const MODERATION_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'feed', pathMatch: 'full' },
      { path: 'feed', component: ModerationFeedCompleteComponent },
      { path: ':id', component: ModerationDetailComponent }
    ]
  }
];
