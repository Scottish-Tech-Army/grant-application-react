import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Dashboard(): JSX.Element {
  const [stats, setStats] = useState<{ fields: number; apps: number }>({ fields: 0, apps: 0 });

  useEffect(() => {
    (async () => {
      const [fields, apps] = await Promise.all([api.commonFields(), api.applications()]);
      setStats({ fields: fields.length, apps: apps.length });
    })();
  }, []);

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Welcome</h3>
      <p>
        GrantKit helps manage reusable “common” grant answers and locks versions per application so historic applications remain consistent.
      </p>
      <div className="row">
        <span className="badge">Common fields: {stats.fields}</span>
        <span className="badge">Applications: {stats.apps}</span>
      </div>
      <hr />
      <div className="small">
        Tip: Fill answers in <b>Common Library</b>, then create an <b>Application</b> and select required fields.
      </div>
    </div>
  );
}
