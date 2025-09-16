import './App.css'

// Simplified version for debugging
function App() {
  console.log('App component rendering...');
  
  return (
    <div style={{ padding: '20px', backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
      <h1 style={{ color: 'blue' }}>MUD & TOTE Diagram Tool - Debug</h1>
      <p>If you can see this, React is working!</p>
      <button onClick={() => alert('Button clicked!')}>Test Button</button>
    </div>
  )
}

export default App
