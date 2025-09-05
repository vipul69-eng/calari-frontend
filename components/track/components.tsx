export function EnhancedMacro({
  label,
  value,
  unit,
  isLoading = false,
}: {
  label: string;
  value: number;
  unit: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 text-center">
        <div className="h-3 w-12 bg-muted rounded mx-auto mb-2 animate-pulse" />
        <div className="h-5 w-8 bg-muted rounded mx-auto animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 text-center shadow-sm">
      <div className="text-sm font-medium text-muted-foreground mb-1">
        {label}
      </div>
      <div className="text-lg font-semibold text-card-foreground">
        {value}
        <span className="text-xs font-normal text-muted-foreground ml-1">
          {unit}
        </span>
      </div>
    </div>
  );
}

export function LoadingState({
  type,
  progress = 0,
  message,
}: {
  type: "upload" | "analyze" | "processing" | "voice";
  progress?: number;
  message: string;
}) {
  const getLoadingIndicator = () => {
    switch (type) {
      case "upload":
        return (
          <div className="animate-spin w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full" />
        );
      case "analyze":
        return (
          <div className="animate-pulse w-6 h-6 bg-primary rounded-full" />
        );
      case "processing":
        return (
          <div className="animate-spin w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full" />
        );
      case "voice":
        return (
          <div className="animate-pulse w-6 h-6 bg-primary rounded-full" />
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">{getLoadingIndicator()}</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {message}
        </h3>

        {type === "upload" && (
          <>
            <div className="w-full bg-muted rounded-full h-2 mt-4 overflow-hidden">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {progress}% uploaded
            </p>
          </>
        )}

        {(type === "analyze" || type === "voice") && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <div
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
