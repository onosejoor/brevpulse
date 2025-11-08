import {
  Mail,
  Calendar,
  GitPullRequest,
  MessageSquare,
  Figma,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";

import { DigestPayload, DigestSource } from "@repo/shared-types/globals";

const getIcon = (type: DigestSource) => {
  switch (type) {
    case "gmail":
      return <Mail className="w-5 h-5" />;
    case "calendar":
      return <Calendar className="w-5 h-5" />;
    case "github":
      return <GitPullRequest className="w-5 h-5" />;
    case "slack":
      return <MessageSquare className="w-5 h-5" />;
    case "figma":
      return <Figma className="w-5 h-5" />;
    default:
      return null;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "medium":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "low":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getPriorityLabel = (priority: string) => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

export function DigestTemplate({ digest }: { digest: DigestPayload }) {
  const digestItems = digest.items;
  const summary = digest.summary;

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      {/* Email Container */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-slate-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-12 text-white">
          <h1 className="text-3xl font-bold mb-2">Your Daily Digest</h1>
          <p className="text-purple-100">
            Everything that mattered today, in one place
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          {/* Intro */}
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm">
            Good morning! Here&apos;s what happened while you were away. Focus
            on what matters.
          </p>

          {/* Digest Items */}
          <div className="space-y-4 mb-8">
            {digestItems.map((item, idx) => (
              <div
                key={idx}
                className="border border-gray-200 dark:border-slate-700 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1 text-purple-600 dark:text-purple-400">
                      {getIcon(item.source)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {item.title}
                        </h3>
                        {item.count && (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold">
                            {item.count}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Priority Tag */}
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}
                    >
                      {getPriorityLabel(item.priority)}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                {item.actions?.map((action, idx) => (
                  <div key={idx} className="mt-4 ml-9">
                    <a
                      href={action.url}
                      className="inline-flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                    >
                      {action.label} →
                    </a>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 mb-8">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Today&apos;s Summary
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    High Priority
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {summary.byPriority.high} items
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Medium Priority
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {summary.byPriority.medium} items
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Low Priority
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {summary.byPriority.low} items
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Total Items
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {summary.totalItems} items
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Ready to dive in? Check out your full dashboard for more details.
            </p>
            <a
              href="#"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Open Dashboard
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-slate-800 px-8 py-6 border-t border-gray-200 dark:border-slate-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            Brevpulse • Privacy-first daily digest •{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <a
              href="#"
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
            >
              Preferences
            </a>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <a
              href="#"
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
            >
              Unsubscribe
            </a>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <a
              href="#"
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
            >
              Privacy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
