import type { ReactNode } from "react";

type Props = {
  title: string;
  rightSlot?: ReactNode;
  children: ReactNode;
};

export default function AppShell({ title, rightSlot, children }: Props) {
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__title">{title}</div>
        <div className="topbar__right">{rightSlot}</div>
      </header>

      <main className="container">{children}</main>
    </div>
  );
}
