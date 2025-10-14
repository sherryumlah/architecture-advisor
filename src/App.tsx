import Questionnaire from "./Questionnaire";

export default function App() {
  return (
    <div className="max-w-3xl mx-auto min-h-screen bg-slate-50 text-slate-900">
      <header className="p-4 border-b bg-white">
        <h1 className="text-xl font-semibold">Architecture Advisor</h1>
        <p className="text-sm text-slate-600">Answer questions → get a recommendation.</p>
      </header>
      <main className="max-w-3xl mx-auto p-4">
        <Questionnaire />
      </main>
    </div>
  );
}
