
interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="text-center py-12">
          <div className="text-gray-500">{message}</div>
        </div>
      </div>
    </div>
  );
}
