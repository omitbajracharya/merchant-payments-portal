import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuditService } from '../../core/services/audit.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-security-docs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './security-docs.component.html',
  styleUrls: ['./security-docs.component.scss'],
})
export class SecurityDocsComponent {
  readonly auditService = inject(AuditService);
  readonly authService = inject(AuthService);
  readonly auditLogs = this.auditService.logs;

  readonly cspDirectives = [
    {
      directive: "default-src 'self'",
      purpose: 'Restricts loading resources to the application origin by default.',
      threatMitigated: 'Prevents untrusted resources from unauthorized hosts.',
    },
    {
      directive: "script-src 'self'",
      purpose: 'Allows only first-party bundled JavaScript assets. No unsafe-eval.',
      threatMitigated: 'Eliminates Cross-Site Scripting (XSS) and remote script injections.',
    },
    {
      directive: "connect-src 'self' https://api.paygate.io http://localhost:3000 ws://localhost:3000",
      purpose: 'Restricts fetch/XHR and Socket.IO WebSocket destinations to trusted underwriting endpoints.',
      threatMitigated: 'Stops malicious exfiltration of sensitive card or banking data (Magecart).',
    },
    {
      directive: "frame-ancestors 'none' (HTTP Header)",
      purpose: 'Prohibits embedding this application in iframes on third-party sites (Enforced via HTTP response header).',
      threatMitigated: 'Defeats Clickjacking and UI redressing attacks.',
    },
    {
      directive: "object-src 'none'",
      purpose: 'Disables legacy browser plugins (Flash, Java, Silverlight).',
      threatMitigated: 'Eliminates plugin-level memory corruption and sandbox escape vulnerabilities.',
    },
    {
      directive: "form-action 'self'",
      purpose: 'Restricts targets of HTML form submissions.',
      threatMitigated: 'Guards against phishing form hijacking.',
    },
  ];
}

