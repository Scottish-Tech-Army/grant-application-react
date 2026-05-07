export default function Topbar() {
    return (
      <header className="topbar">
        <div>
          <h1 className="pageTitle">Grant Application Info Management</h1>
          <p className="pageHint">Store common answers, manage applications, export easily.</p>
        </div>
  
        <div className="topbarActions">
          <button className="btnPrimary">+ New Application</button>
        </div>
      </header>
    );
  }