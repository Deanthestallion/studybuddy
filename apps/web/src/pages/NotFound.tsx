import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center p-4 text-center">
      <div>
        <p className="text-6xl font-black text-brand-600">404</p>
        <p className="mt-2 text-lg font-medium">Page not found</p>
        <p className="mb-6 text-sm text-slate-500">The page you’re looking for doesn’t exist.</p>
        <Link to="/">
          <Button>Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
