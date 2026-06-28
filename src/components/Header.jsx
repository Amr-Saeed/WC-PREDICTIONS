export default function Header({ user, onSwitchUser }) {
  return (
    <div className="top-header">
      <div className="brand">
        <div className="trophy">🏆</div>
        <div>
          <h1>World Cup 2026</h1>
          <div className="sub">Round of 32 Predictions</div>
        </div>
      </div>
      <div className="user-pill">
        <span className="dot"></span>
        {user.name}
        <button onClick={onSwitchUser}>switch</button>
      </div>
    </div>
  );
}
