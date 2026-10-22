import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
} from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/auth.model';

@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  private allowedRoles: UserRole[] = [];
  private hasView = false;

  @Input() set appHasRole(roles: UserRole | UserRole[]) {
    this.allowedRoles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  constructor() {
    // Reactively update whenever currentRole Signal changes
    effect(() => {
      // Register dependency on the currentRole signal
      this.authService.currentRole();
      this.updateView();
    });
  }

  private updateView(): void {
    const role = this.authService.currentRole();
    const isAllowed = !!role && this.allowedRoles.includes(role);

    if (isAllowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!isAllowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

