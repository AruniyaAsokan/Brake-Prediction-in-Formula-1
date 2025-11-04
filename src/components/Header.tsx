export const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <img
                src="/F1.svg"
                alt="F1 Logo"
                className="w-16 h-16 object-contain"
                draggable={false}
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                F1 Brake System Digital Twin
              </h1>
              <p className="text-sm text-muted-foreground">
                Real-Time Brake System Failure Prediction
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-f1-green rounded-full"></div>
              <span>Stage 1-5: Complete Digital Twin</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Real-time Physics • Bi-LSTM Comparison • Race Replay</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};