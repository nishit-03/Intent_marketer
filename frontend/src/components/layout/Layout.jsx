import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children, role }) {
  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar role={role} />
      <div className="flex-1 ml-[240px] max-w-[calc(100vw-240px)] overflow-x-hidden">
        <Header />
        <main className="p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
