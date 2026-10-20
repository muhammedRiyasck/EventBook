import React from "react";

interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  fullPage = true,
}) => {
  if (fullPage) {
    return (
      <div
        className="page-wrapper"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
        }}
      >
        <div className="spinner" />
        {message && <p className="text-sm text-slate-400">{message}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="spinner" />
      {message && <p className="mt-4 text-sm text-slate-400">{message}</p>}
    </div>
  );
};

export default LoadingState;
