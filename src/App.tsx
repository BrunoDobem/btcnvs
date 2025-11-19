import { ChatContainer } from './components/ChatContainer';
import { DataLegend } from './components/DataLegend';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[90vh] bg-white rounded-lg shadow-lg flex flex-col overflow-hidden relative">
        <ChatContainer />
        <DataLegend />
      </div>
    </div>
  );
}

export default App;

