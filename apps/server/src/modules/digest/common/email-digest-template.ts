import type {
  DigestPayload,
  DigestPriority,
  DigestSource,
} from '@repo/shared-types/globals';

const sourceIcons: Record<DigestSource, string> = {
  gmail: '✉️',
  calendar: '📅',
  github: '⚡',
  slack: '💬',
  figma: '🎨',
};

const sourceColors: Record<DigestSource, string> = {
  gmail: '#64748b',
  calendar: '#64748b',
  github: '#64748b',
  slack: '#64748b',
  figma: '#64748b',
};

const priorityColors: Record<DigestPriority, { bg: string; text: string }> = {
  high: { bg: '#fef2f2', text: '#dc2626' },
  medium: { bg: '#fffbeb', text: '#d97706' },
  low: { bg: '#f0f9ff', text: '#0284c7' },
};

export function generateEmailHTML(payload: DigestPayload): string {
  const { items, summary, plan = 'free' } = payload;

  const priorityTag = (priority: DigestPriority) => {
    const colors = priorityColors[priority];
    return `<span class="priority-tag priority-${priority}" style="background-color: ${colors.bg}; color: ${colors.text};">${priority}</span>`;
  };

  const itemsHTML = items
    .map(
      (item) => `
    <div class="item-card">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
        <tr>
          <td style="vertical-align: top;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-right: 10px; vertical-align: middle;">
                  <div class="source-icon" style="color: ${sourceColors[item.source]};">
                    ${sourceIcons[item.source]}
                  </div>
                </td>
                <td style="vertical-align: middle;">
                  <h3 class="item-title">${item.title}</h3>
                </td>
              </tr>
            </table>
          </td>
          <td style="text-align: right; vertical-align: top; white-space: nowrap; padding-left: 16px;">
            ${priorityTag(item.priority)}
          </td>
        </tr>
      </table>
      ${item.description ? `<p class="item-description">${item.description}</p>` : ''}
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align: middle;">
            <span class="item-count">${item.count} ${item.count === 1 ? 'item' : 'items'}</span>
          </td>
          ${
            item.actions && item.actions.length > 0
              ? `<td style="text-align: right; vertical-align: middle; padding-left: 12px;">
            ${item.actions.map((action) => `<a href="${action.url}" class="action-btn" style="margin-left: 12px;">View →</a>`).join('')}
          </td>`
              : ''
          }
        </tr>
      </table>
    </div>
  `,
    )
    .join('');

  const summaryHTML = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="text-align: center; vertical-align: top; width: 45%;">
          <p class="summary-value">${summary.totalItems}</p>
          <p class="summary-label">Total updates</p>
        </td>
        <td style="text-align: center; vertical-align: middle; width: 10%;">
          <div class="summary-divider"></div>
        </td>
        <td style="text-align: center; vertical-align: top; width: 45%;">
          <p class="summary-value highlight">${summary.byPriority.high || 0}</p>
          <p class="summary-label">High priority</p>
        </td>
      </tr>
    </table>
  `;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Brevpulse Daily Digest</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      background-color: #fafafa;
      color: #0f172a;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    .header {
      text-align: center;
      margin-bottom: 48px;
    }

    .logo {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.5px;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 16px;
    }

    .header h1 {
      font-size: 32px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }

    .header-subtitle {
      font-size: 15px;
      color: #64748b;
      margin-bottom: 20px;
    }

    .plan-badge {
      display: inline-block;
      padding: 6px 14px;
      background-color: #f1f5f9;
      color: #475569;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.3px;
      text-transform: capitalize;
    }

    .summary-section {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 32px;
    }

    .summary-grid {
      width: 100%;
    }

    .summary-item {
      text-align: center;
    }

    .summary-value {
      font-size: 40px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
      line-height: 1;
    }

    .summary-value.highlight {
      color: #dc2626;
    }

    .summary-label {
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
    }

    .summary-divider {
      width: 1px;
      height: 48px;
      background-color: #e2e8f0;
      margin: 0 auto;
    }

    .items-section {
      margin-bottom: 48px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 20px;
    }

    .item-card {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 16px;
      transition: border-color 0.2s;
    }

    .item-card:hover {
      border-color: #cbd5e1;
    }

    .item-header {
      margin-bottom: 12px;
    }

    .item-title-row {
      display: inline-block;
      vertical-align: middle;
    }

    .source-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .item-title {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      line-height: 1.4;
    }

    .priority-tag {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: capitalize;
      flex-shrink: 0;
    }

    .item-description {
      font-size: 14px;
      color: #475569;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .item-footer {
      width: 100%;
    }

    .item-count {
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
    }

    .item-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .action-btn {
      font-size: 13px;
      font-weight: 500;
      color: #0f172a;
      text-decoration: none;
      transition: color 0.2s;
      display: inline-block;
    }

    .action-btn:hover {
      color: #3b82f6;
    }

    .footer {
      text-align: center;
      padding-top: 32px;
      border-top: 1px solid #e2e8f0;
    }

    .footer-text {
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 12px;
    }

    .footer-links {
      font-size: 13px;
    }

    .footer-links a {
      color: #64748b;
      text-decoration: none;
      margin: 0 8px;
      transition: color 0.2s;
    }

    .footer-links a:hover {
      color: #0f172a;
    }

    @media (max-width: 640px) {
      .container {
        padding: 24px 16px;
      }

      .header {
        margin-bottom: 32px;
      }

      .header h1 {
        font-size: 24px;
      }

      .header-subtitle {
        font-size: 14px;
      }

      .summary-section {
        padding: 24px 20px;
        margin-bottom: 24px;
      }

      .summary-grid {
        gap: 20px;
      }

      .summary-value {
        font-size: 32px;
      }

      .summary-divider {
        height: 40px;
      }

      .item-card {
        padding: 20px;
        margin-bottom: 12px;
      }

      .item-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .item-title {
        font-size: 15px;
      }

      .item-description {
        font-size: 13px;
      }

      .item-footer {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }

      .footer {
        padding-top: 24px;
      }
    }

    @media (max-width: 480px) {
      .container {
        padding: 20px 12px;
      }

      .header h1 {
        font-size: 22px;
      }

      .summary-section {
        padding: 20px 16px;
      }

      .summary-grid {
        flex-direction: column;
        gap: 24px;
      }

      .summary-divider {
        width: 48px;
        height: 1px;
      }

      .item-card {
        padding: 16px;
        border-radius: 10px;
      }

      .item-title {
        font-size: 14px;
      }

      .item-description {
        font-size: 13px;
        margin-bottom: 12px;
      }

      .action-btn {
        font-size: 12px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">Brevpulse</div>
      <h1>Daily Digest</h1>
      <p class="header-subtitle">Your daily summary of what matters</p>
      <div class="plan-badge">${plan} plan</div>
    </div>

    <!-- Summary -->
    <div class="summary-section">
      ${summaryHTML}
    </div>

    <!-- Items -->
    <div class="items-section">
      <h2 class="section-title">Today's Updates</h2>
      ${itemsHTML}
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">Brevpulse • Privacy-first daily digest</p>
      <div class="footer-links">
        <a href="#">View online</a>
        <span style="color: #cbd5e1;">•</span>
        <a href="#">Preferences</a>
        <span style="color: #cbd5e1;">•</span>
        <a href="#">Unsubscribe</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
