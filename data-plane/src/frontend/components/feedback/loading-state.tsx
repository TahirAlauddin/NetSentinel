import { AppShell } from "@/components/layout/app-shell";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    // <AppShell>
    //   <div className="flex items-center justify-center h-64">
    //     <div className="text-muted-foreground">{message}</div>
    //   </div>
    // </AppShell>
    <AppShell>
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-7xl mx-auto p-8">
          <div className="text-center py-12">
            <div className="text-gray-500">{message}</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
