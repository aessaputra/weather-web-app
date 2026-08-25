import './styles.css'

export default function App() {
  return (
    <main>
      <header>
        <p className="eyebrow">LIVE ATMOSPHERIC TELEMETRY</p>
        <h1>WEATHER<br />OUTLOOK</h1>
      </header>
      <form className="search">
        <label htmlFor="location">LOCATION</label>
        <input id="location" name="location" required placeholder="JAKARTA" />
        <button type="submit">SEARCH</button>
      </form>
    </main>
  )
}
