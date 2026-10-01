import React from "react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled application error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="container app-error-page">
        <div className="empty-state error-state">
          <h1>Something went wrong.</h1>
          <p>Reload the page to continue. Your saved bag is kept in this browser.</p>
          <button className="btn" type="button" onClick={() => window.location.reload()}>
            Reload MOR
          </button>
        </div>
      </main>
    );
  }
}
