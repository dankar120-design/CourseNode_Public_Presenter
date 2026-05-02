import { submitPreviewPassword } from './actions';

export default async function PreviewPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const isError = searchParams?.error === '1';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        
        <h1 className="text-xl font-bold text-slate-800 mb-2 text-center">Staging Environment</h1>
        <p className="text-sm text-slate-500 mb-8 text-center px-4">
          Denna utvecklingsmiljö är låst. Ange koden för att fortsätta.
        </p>

        {isError && (
          <div className="w-full bg-red-50 text-red-600 text-xs font-medium px-4 py-2 rounded-lg text-center mb-6 border border-red-100">
            Felaktig kod. Försök igen.
          </div>
        )}

        <form action={submitPreviewPassword} className="w-full">
          <div className="space-y-4">
            <input 
              type="password" 
              name="password"
              placeholder="Preview code"
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-center tracking-widest font-mono"
            />
            <button 
              type="submit"
              className="w-full bg-slate-900 text-white font-medium py-3 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Lås upp
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
