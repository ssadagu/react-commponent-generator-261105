export function WinTitle({ title }: { title: string }) {
  return (
    <div className="win-title" aria-hidden="true">
      <span className="win-box" />
      <span className="win-title-text">{title}</span>
      <span className="win-box" />
    </div>
  );
}
