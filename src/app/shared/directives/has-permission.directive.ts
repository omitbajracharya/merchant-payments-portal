import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
} from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Permission } from '../../core/models/auth.model';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  private requiredPermission?: Permission;
  private hasView = false;

  @Input() set appHasPermission(permission: Permission) {
    this.requiredPermission = permission;
    this.updateView();
  }

  constructor() {
    effect(() => {
      this.authService.permissions();
      this.updateView();
    });
  }

  private updateView(): void {
    const isAllowed = this.requiredPermission
      ? this.authService.hasPermission(this.requiredPermission)
      : false;

    if (isAllowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!isAllowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

