import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface SidebarProps {
  isOpen?: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const [location] = useLocation();
  
  // Fetch user data if authenticated
  const { data: user } = useQuery<{ 
    name: string; 
    email: string; 
    profileImage?: string 
  } | null>({ 
    queryKey: ['/api/user'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: false // Only fetch when user is authenticated - this will be updated in production
  });

  const sidebarClass = `sidebar w-64 bg-white shadow-lg h-screen fixed lg:sticky top-0 ${isOpen ? 'open' : ''}`;

  return (
    <aside className={sidebarClass}>
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="p-5 border-b">
          <div className="flex items-center">
            <span className="material-icons text-[#FF0000] mr-2">smart_display</span>
            <h1 className="text-xl font-bold">YTInsights</h1>
          </div>
          <p className="text-xs text-[#999999] mt-1">YouTube Retention Analytics</p>
        </div>
        
        {/* Nav Items */}
        <nav className="flex-1 p-4">
          <ul>
            <li className="mb-1">
              <Link href="/">
                <a className={`flex items-center p-3 rounded ${location === '/' ? 'bg-[#F9F9F9] text-[#FF0000]' : 'hover:bg-[#F9F9F9]'}`}>
                  <span className={`material-icons mr-3 ${location === '/' ? 'text-[#FF0000]' : 'text-[#666666]'}`}>dashboard</span>
                  <span>Dashboard</span>
                </a>
              </Link>
            </li>
            <li className="mb-1">
              <Link href="/retention-analysis">
                <a className={`flex items-center p-3 rounded ${location === '/retention-analysis' ? 'bg-[#F9F9F9] text-[#FF0000]' : 'hover:bg-[#F9F9F9]'}`}>
                  <span className={`material-icons mr-3 ${location === '/retention-analysis' ? 'text-[#FF0000]' : 'text-[#666666]'}`}>analytics</span>
                  <span>Retention Analysis</span>
                </a>
              </Link>
            </li>
            <li className="mb-1">
              <Link href="/videos">
                <a className={`flex items-center p-3 rounded ${location === '/videos' ? 'bg-[#F9F9F9] text-[#FF0000]' : 'hover:bg-[#F9F9F9]'}`}>
                  <span className={`material-icons mr-3 ${location === '/videos' ? 'text-[#FF0000]' : 'text-[#666666]'}`}>movie</span>
                  <span>My Videos</span>
                </a>
              </Link>
            </li>
            <li className="mb-1">
              <Link href="/settings">
                <a className={`flex items-center p-3 rounded ${location === '/settings' ? 'bg-[#F9F9F9] text-[#FF0000]' : 'hover:bg-[#F9F9F9]'}`}>
                  <span className={`material-icons mr-3 ${location === '/settings' ? 'text-[#FF0000]' : 'text-[#666666]'}`}>settings</span>
                  <span>Settings</span>
                </a>
              </Link>
            </li>
          </ul>
        </nav>
        
        {/* User Info */}
        <div className="p-4 border-t">
          {user ? (
            <div className="flex items-center">
              <img 
                src={user.profileImage || 'https://via.placeholder.com/40'} 
                alt="User profile" 
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-[#999999]">{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                <span className="material-icons text-gray-400">person</span>
              </div>
              <div>
                <p className="font-medium text-sm">Guest User</p>
                <p className="text-xs text-[#999999]">Not connected</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
