import type { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";

export default function RecentApplicationsTable({ rows }) {
    return (
      <div className="card">
        <div className="cardHeader">
          <h2>Recent Grant Applications</h2>
          <button className="btnGhost">View all</button>
        </div>
  
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Application</th>
                <th>Funder</th>
                <th>Status</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: { id: Key | null | undefined; name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; funder: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; status: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; updatedAt: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }) => (
                <tr key={r.id}>
                  <td className="strong">{r.name}</td>
                  <td>{r.funder}</td>
                  <td>
                    <span className={`pill ${r.status === "Submitted" ? "pillGreen" : "pillBlue"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>{r.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }