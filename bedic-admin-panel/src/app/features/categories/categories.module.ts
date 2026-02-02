import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { CategoriesListComponent } from './categories-list/categories-list.component';
import { CategoryFormComponent } from './category-form/category-form.component';
import { CategoryDeleteComponent } from './category-delete/category-delete.component';
import { CategoryService } from './category.service';

@NgModule({
  declarations: [
    CategoriesListComponent,
    CategoryFormComponent,
    CategoryDeleteComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  providers: [
    CategoryService
  ],
  exports: [
    CategoriesListComponent,
    CategoryFormComponent,
    CategoryDeleteComponent
  ]
})
export class CategoriesModule { }
