import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children, role }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />
      <div className="flex-1 ml-[240px]">
        <Header />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
