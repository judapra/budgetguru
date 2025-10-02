import { Logo } from "./logo";

export function AppHeader() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <Logo />
      </div>
    </header>
  );
}
