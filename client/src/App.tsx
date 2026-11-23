function App() {
  return (
    <div className="min-h-screen bg-bizora-background text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-bizora-primary">
          Bizora
        </h1>

        <p className="text-gray-400">
          Business operations, simplified.
        </p>

        <div className="inline-flex items-center gap-2 rounded-full border border-bizora-border bg-bizora-surface px-4 py-2 text-sm text-bizora-success">
          <span className="h-2 w-2 rounded-full bg-bizora-success"></span>
          Frontend environment ready
        </div>
      </div>
    </div>
  );
}

export default App;